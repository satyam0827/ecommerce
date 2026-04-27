package com.Ecommerce.E_com.Repository;

import com.Ecommerce.E_com.Entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface AddressRepository extends JpaRepository<Address,Long> {
    boolean existsByUserId(Long userId);
    boolean existsByUserIdAndDefaultAddressTrue(Long userId);
    Optional<Address> findByIdAndUser_Id(Long addressId, Long userId);
    List<Address> findByUser_IdOrderByDefaultAddressDescIdDesc(Long userId);
    Optional<Address> findFirstByUser_IdOrderByIdDesc(Long userId);

    @Modifying
    @Query("update Address a set a.defaultAddress = false where a.user.id = :userId and a.defaultAddress = true")
    void clearDefaultForUser(@Param("userId") Long userId);
}
