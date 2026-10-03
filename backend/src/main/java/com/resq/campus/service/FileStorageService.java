package com.resq.campus.service;

import com.resq.campus.exception.ApiException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Stores uploaded images. Validates size, declared type AND the real file signature,
 * and ignores the client's file name (a random UUID name is generated).
 */
@Service
public class FileStorageService {

    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final Pattern SAFE_NAME = Pattern.compile("^[a-f0-9\\-]{36}\\.(jpg|png|webp)$");

    @Value("${resq.upload-dir}")
    private String uploadDir;

    private Path root;

    @PostConstruct
    void init() throws IOException {
        root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    public record Stored(String url, String contentType) {}

    /** Validates and saves an image; returns its API url (e.g. /api/files/uuid.jpg). */
    public Stored storeImage(MultipartFile file) {
        if (file == null || file.isEmpty()) throw ApiException.badRequest("The uploaded file is empty");
        if (file.getSize() > MAX_BYTES) throw new ApiException(org.springframework.http.HttpStatus.PAYLOAD_TOO_LARGE,
                "File is too large (maximum 5 MB)");

        String ext;
        String contentType;
        try (InputStream in = file.getInputStream()) {
            byte[] head = in.readNBytes(12);
            if (head.length >= 3 && (head[0] & 0xFF) == 0xFF && (head[1] & 0xFF) == 0xD8 && (head[2] & 0xFF) == 0xFF) {
                ext = "jpg";
                contentType = "image/jpeg";
            } else if (head.length >= 8 && (head[0] & 0xFF) == 0x89 && head[1] == 'P' && head[2] == 'N' && head[3] == 'G') {
                ext = "png";
                contentType = "image/png";
            } else if (head.length >= 12 && head[0] == 'R' && head[1] == 'I' && head[2] == 'F' && head[3] == 'F'
                    && head[8] == 'W' && head[9] == 'E' && head[10] == 'B' && head[11] == 'P') {
                ext = "webp";
                contentType = "image/webp";
            } else {
                throw ApiException.badRequest("Only JPG, PNG or WEBP images are allowed");
            }
        } catch (IOException e) {
            throw ApiException.badRequest("Could not read the uploaded file");
        }

        String name = UUID.randomUUID() + "." + ext;
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, root.resolve(name), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "Could not save the file");
        }
        return new Stored("/api/files/" + name, contentType);
    }

    public Resource load(String name) {
        if (name == null || !SAFE_NAME.matcher(name).matches()) throw ApiException.notFound("File not found");
        Path path = root.resolve(name).normalize();
        if (!path.startsWith(root) || !Files.exists(path)) throw ApiException.notFound("File not found");
        return new PathResource(path);
    }
}
