package com.Ecommerce.E_com.Service;


import com.Ecommerce.E_com.Dto.ProductReq;
import com.Ecommerce.E_com.Entity.Product;
import com.Ecommerce.E_com.Repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductImageStorageService productImageStorageService;

    public ProductService(ProductRepository productRepository, ProductImageStorageService productImageStorageService){
        this.productRepository = productRepository;
        this.productImageStorageService = productImageStorageService;
    }

    //add product
    @Transactional
    public Product addProduct(ProductReq productReq){
        Product product = new Product();
        product.setPName(readValidatedName(productReq));
        product.setPPrice(readValidatedPrice(productReq));
        product.setImageUrl(productImageStorageService.store(productReq.getImage()));
        return productRepository.save(product);
    }

    //get all products
    public List<Product> getAllProduct(String query) {
        if (query == null || query.isBlank()) {
            return productRepository.findAll();
        }

        return productRepository.searchByName(query.trim());
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found with id: "+id));
    }


    //logic to update the product details
    @Transactional
    public Product updateProduct(Long id, ProductReq productReq) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(()-> new RuntimeException("Product not found while updating the product details!"));

        existingProduct.setPName(readValidatedName(productReq));
        existingProduct.setPPrice(readValidatedPrice(productReq));

        MultipartFile image = productReq.getImage();
        if (image != null && !image.isEmpty()) {
            String previousImageUrl = existingProduct.getImageUrl();
            String newImageUrl = productImageStorageService.store(image);
            existingProduct.setImageUrl(newImageUrl);
            Product updatedProduct = productRepository.save(existingProduct);
            productImageStorageService.deleteByUrl(previousImageUrl);
            return updatedProduct;
        }

        return productRepository.save(existingProduct);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found while deleting the product!"));

        productImageStorageService.deleteByUrl(existingProduct.getImageUrl());
        productRepository.delete(existingProduct);
    }

    private String readValidatedName(ProductReq productReq) {
        String productName = productReq.getPName();
        if (productName == null || productName.isBlank()) {
            throw new RuntimeException("Product name is required.");
        }
        return productName.trim();
    }

    private int readValidatedPrice(ProductReq productReq) {
        Integer productPrice = productReq.getPPrice();
        if (productPrice == null) {
            throw new RuntimeException("Product price is required.");
        }
        if (productPrice < 0) {
            throw new RuntimeException("Product price cannot be negative.");
        }
        return productPrice;
    }
}
