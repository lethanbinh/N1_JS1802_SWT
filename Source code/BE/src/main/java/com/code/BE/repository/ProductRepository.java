package com.code.BE.repository;

import com.code.BE.model.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    Product findById (int id);
    Product findByCode (String code);
    List<Product> findByStallNameContaining (String name);
    List<Product> findByNameContaining (String name);
}
