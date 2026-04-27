package com.Ecommerce.E_com.Controller;

import com.Ecommerce.E_com.Dto.ProductReq;
import com.Ecommerce.E_com.Entity.Product;
import com.Ecommerce.E_com.Service.ProductService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ProductController {

    private final ProductService productService;

   public ProductController(ProductService productService){
        this.productService = productService;
    }

    @GetMapping("/products")
    public List<Product> getAllProduct(@RequestParam(required = false) String query){
        return productService.getAllProduct(query);
    }

    @PostMapping("/products")
    public Product addProduct(@ModelAttribute ProductReq productReq){
       return productService.addProduct(productReq);
    }

    @GetMapping("/products/{id}")
    public Product getProductById(@PathVariable Long id){
       return productService.getProductById(id);
    }

    @PutMapping("/products/{id}")
    public Product updateProduct(@PathVariable Long id, @ModelAttribute ProductReq productReq){
       return productService.updateProduct(id,productReq);
    }

    @DeleteMapping("/products/{id}")
    public void deleteProduct(@PathVariable Long id){
        productService.deleteProduct(id);
    }


}
