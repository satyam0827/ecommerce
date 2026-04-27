package com.Ecommerce.E_com.Repository;

import com.Ecommerce.E_com.Entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    @Query("SELECT p FROM Product p WHERE UPPER(p.pName) LIKE UPPER(CONCAT('%', :query, '%'))")
    List<Product> searchByName(@Param("query") String query);
}
