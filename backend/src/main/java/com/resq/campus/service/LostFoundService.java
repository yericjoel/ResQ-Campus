package com.resq.campus.service;

import com.resq.campus.dto.Dtos.*;
import com.resq.campus.exception.ApiException;
import com.resq.campus.model.Enums.*;
import com.resq.campus.model.LostFound;
import com.resq.campus.model.LostFoundMatch;
import com.resq.campus.model.User;
import com.resq.campus.repository.LostFoundMatchRepository;
import com.resq.campus.repository.LostFoundRepository;
import com.resq.campus.repository.UserRepository;
import com.resq.campus.security.CurrentUser;
import com.resq.campus.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LostFoundService {

    private final LostFoundRepository items;
    private final LostFoundMatchRepository matches;
    private final UserRepository users;
    private final FileStorageService files;
    private final NotificationService notifications;

    public record CreateInput(ItemType itemType, String itemName, String category, String description,
                              String location, LocalDate date, String contactPreference) {}

    @Transactional
    public LostFoundDto create(CurrentUser me, CreateInput in, MultipartFile photo) {
        User user = users.findById(me.id()).orElseThrow(() -> ApiException.notFound("User not found"));
        if (in.date().isAfter(LocalDate.now().plusDays(1))) throw ApiException.badRequest("Date cannot be in the future");

        LostFound item = new LostFound();
        item.setUser(user);
        item.setItemType(in.itemType());
        item.setItemName(in.itemName().trim());
        item.setCategory(in.category().trim());
        item.setDescription(in.description() == null ? null : in.description().trim());
        item.setLocation(in.location().trim());
        item.setDate(in.date());
        item.setContactPreference(in.contactPreference() == null ? null : in.contactPreference().trim());
        if (photo != null && !photo.isEmpty()) item.setImageUrl(files.storeImage(photo).url());
        item = items.save(item);

        notifications.notifyAdmins("New " + in.itemType().name().toLowerCase() + " item reported",
                item.getItemName() + " · " + item.getLocation(), NotificationType.LOST_FOUND, item.getId());
        return Mapper.lostFound(item);
    }

    /** type: LOST | FOUND | null (all). mine=true limits to the caller's own items. */
    @Transactional(readOnly = true)
    public List<LostFoundDto> list(CurrentUser me, String type, boolean mine) {
        List<LostFound> list;
        if (mine) {
            list = items.findByUserIdOrderByCreatedAtDesc(me.id());
        } else if (type != null && !type.isBlank()) {
            list = items.findByItemTypeOrderByCreatedAtDesc(parseType(type));
        } else {
            list = items.findAllByOrderByCreatedAtDesc();
        }
        if (mine && type != null && !type.isBlank()) {
            ItemType t = parseType(type);
            list = list.stream().filter(i -> i.getItemType() == t).toList();
        }
        return list.stream().map(Mapper::lostFound).toList();
    }

    @Transactional(readOnly = true)
    public LostFoundDto get(Long id) {
        return Mapper.lostFound(find(id));
    }

    @Transactional
    public LostFoundDto update(CurrentUser me, Long id, LostFoundUpdateRequest req) {
        LostFound item = find(id);
        requireOwnerOrAdmin(me, item);
        if (req.itemName() != null && !req.itemName().isBlank()) item.setItemName(req.itemName().trim());
        if (req.category() != null && !req.category().isBlank()) item.setCategory(req.category().trim());
        if (req.description() != null) item.setDescription(req.description().trim());
        if (req.location() != null && !req.location().isBlank()) item.setLocation(req.location().trim());
        if (req.date() != null) item.setDate(req.date());
        if (req.contactPreference() != null) item.setContactPreference(req.contactPreference().trim());
        if (req.status() != null && req.status() != item.getStatus()) {
            if (req.status() == ItemStatus.MATCHED && !me.isAdmin()) {
                throw ApiException.forbidden("Items become MATCHED when a match is verified");
            }
            item.setStatus(req.status());
            if (!item.getUser().getId().equals(me.id())) {
                notifications.notifyUser(item.getUser().getId(), "Lost & Found update",
                        "Your item \"" + item.getItemName() + "\" is now " + item.getStatus().name().toLowerCase() + ".",
                        NotificationType.LOST_FOUND, item.getId());
            }
        }
        return Mapper.lostFound(item);
    }

    @Transactional
    public void delete(CurrentUser me, Long id) {
        LostFound item = find(id);
        requireOwnerOrAdmin(me, item);
        matches.findAllByOrderByCreatedAtDesc().stream()
                .filter(m -> m.getLostItem().getId().equals(id) || m.getFoundItem().getId().equals(id))
                .forEach(matches::delete);
        items.delete(item);
    }

    // ----------------------------------------------------------------------------- matching

    /** Possible matches: opposite type, still open, scored by category / name words / location words. */
    @Transactional(readOnly = true)
    public List<SuggestionDto> suggestions(Long id) {
        LostFound base = find(id);
        ItemType opposite = base.getItemType() == ItemType.LOST ? ItemType.FOUND : ItemType.LOST;
        Set<String> nameWords = words(base.getItemName());
        Set<String> locWords = words(base.getLocation());

        List<SuggestionDto> result = new ArrayList<>();
        for (LostFound candidate : items.findByItemTypeAndStatus(opposite, ItemStatus.OPEN)) {
            int score = 0;
            if (candidate.getCategory().equalsIgnoreCase(base.getCategory())) score += 2;
            score += 2 * overlap(nameWords, words(candidate.getItemName()));
            score += overlap(locWords, words(candidate.getLocation()));
            if (score >= 2) result.add(new SuggestionDto(Mapper.lostFound(candidate), score));
        }
        result.sort(Comparator.comparingInt(SuggestionDto::score).reversed());
        return result.stream().limit(10).toList();
    }

    @Transactional(readOnly = true)
    public List<MatchDto> listMatches(CurrentUser me) {
        var list = me.isAdmin() ? matches.findAllByOrderByCreatedAtDesc() : matches.findForUser(me.id());
        return list.stream().map(Mapper::match).toList();
    }

    @Transactional
    public MatchDto createMatch(CurrentUser me, MatchRequest req) {
        LostFound lost = find(req.lostItemId());
        LostFound found = find(req.foundItemId());
        if (lost.getItemType() != ItemType.LOST || found.getItemType() != ItemType.FOUND) {
            throw ApiException.badRequest("A match needs one lost item and one found item");
        }
        if (!me.isAdmin() && !lost.getUser().getId().equals(me.id()) && !found.getUser().getId().equals(me.id())) {
            throw ApiException.forbidden("You can only propose matches for your own items");
        }
        if (matches.existsByLostItemIdAndFoundItemId(lost.getId(), found.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "This match has already been proposed");
        }
        LostFoundMatch m = new LostFoundMatch();
        m.setLostItem(lost);
        m.setFoundItem(found);
        m.setMatchStatus(MatchStatus.PENDING);
        m = matches.save(m);

        notifyOwners(m, me, "Possible Lost & Found match",
                "\"" + lost.getItemName() + "\" (lost) may match \"" + found.getItemName() + "\" (found). Please verify.");
        return Mapper.match(m);
    }

    @Transactional
    public MatchDto updateMatch(CurrentUser me, Long id, MatchStatus status) {
        LostFoundMatch m = matches.findById(id).orElseThrow(() -> ApiException.notFound("Match not found"));
        boolean involved = m.getLostItem().getUser().getId().equals(me.id()) || m.getFoundItem().getUser().getId().equals(me.id());
        if (!me.isAdmin() && !involved) throw ApiException.notFound("Match not found");
        if (status == MatchStatus.PENDING) throw ApiException.badRequest("Choose VERIFIED or REJECTED");
        if (m.getMatchStatus() != MatchStatus.PENDING) throw ApiException.badRequest("This match was already reviewed");

        m.setMatchStatus(status);
        if (status == MatchStatus.VERIFIED) {
            m.getLostItem().setStatus(ItemStatus.MATCHED);
            m.getFoundItem().setStatus(ItemStatus.MATCHED);
            notifyOwners(m, null, "Lost & Found match verified",
                    "\"" + m.getLostItem().getItemName() + "\" has been matched. Please arrange pickup.");
        }
        return Mapper.match(m);
    }

    // ----------------------------------------------------------------------------- helpers

    private void notifyOwners(LostFoundMatch m, CurrentUser exclude, String title, String message) {
        Set<Long> recipients = new LinkedHashSet<>();
        recipients.add(m.getLostItem().getUser().getId());
        recipients.add(m.getFoundItem().getUser().getId());
        if (exclude != null) recipients.remove(exclude.id());
        recipients.forEach(uid -> notifications.notifyUser(uid, title, message, NotificationType.LOST_FOUND, m.getLostItem().getId()));
    }

    private LostFound find(Long id) {
        return items.findById(id).orElseThrow(() -> ApiException.notFound("Item not found"));
    }

    private void requireOwnerOrAdmin(CurrentUser me, LostFound item) {
        if (!me.isAdmin() && !item.getUser().getId().equals(me.id())) {
            throw ApiException.forbidden("You can only change your own items");
        }
    }

    private ItemType parseType(String type) {
        try {
            return ItemType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Type must be LOST or FOUND");
        }
    }

    private Set<String> words(String text) {
        if (text == null) return Set.of();
        return Arrays.stream(text.toLowerCase().split("[^a-z0-9]+"))
                .filter(w -> w.length() >= 3).collect(Collectors.toSet());
    }

    private int overlap(Set<String> a, Set<String> b) {
        int n = 0;
        for (String w : a) if (b.contains(w)) n++;
        return n;
    }
}
