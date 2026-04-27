package com.Ecommerce.E_com.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class ProductImageStorageService {

    private static final String UPLOAD_URL_PREFIX = "/uploads/";
    private final Path uploadDirectory;

    public ProductImageStorageService(@Value("${app.upload-dir:uploads}") String uploadDir) {
        this.uploadDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDirectory);
        } catch (IOException exception) {
            throw new RuntimeException("Failed to initialize upload directory.", exception);
        }
    }

    public String store(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return null;
        }

        String contentType = image.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed.");
        }

        String originalFileName = StringUtils.cleanPath(image.getOriginalFilename() == null ? "" : image.getOriginalFilename());
        String extension = "";
        int extensionSeparatorIndex = originalFileName.lastIndexOf('.');
        if (extensionSeparatorIndex >= 0) {
            extension = originalFileName.substring(extensionSeparatorIndex);
        }

        String storedFileName = UUID.randomUUID() + extension;
        Path targetPath = uploadDirectory.resolve(storedFileName).normalize();

        if (!targetPath.startsWith(uploadDirectory)) {
            throw new RuntimeException("Invalid image file path.");
        }

        try (InputStream inputStream = image.getInputStream()) {
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new RuntimeException("Failed to store product image.", exception);
        }

        return UPLOAD_URL_PREFIX + storedFileName;
    }

    public void deleteByUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        if (!imageUrl.startsWith(UPLOAD_URL_PREFIX)) {
            return;
        }

        String storedFileName = imageUrl.substring(UPLOAD_URL_PREFIX.length());
        if (storedFileName.isBlank()) {
            return;
        }

        Path imagePath = uploadDirectory.resolve(storedFileName).normalize();
        if (!imagePath.startsWith(uploadDirectory)) {
            throw new RuntimeException("Invalid image file path.");
        }

        try {
            Files.deleteIfExists(imagePath);
        } catch (IOException exception) {
            throw new RuntimeException("Failed to delete product image.", exception);
        }
    }
}
