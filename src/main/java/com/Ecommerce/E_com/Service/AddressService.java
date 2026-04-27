package com.Ecommerce.E_com.Service;

import com.Ecommerce.E_com.Dto.AddressRequest;
import com.Ecommerce.E_com.Dto.AddressResponse;
import com.Ecommerce.E_com.Entity.Address;
import com.Ecommerce.E_com.Entity.User;
import com.Ecommerce.E_com.Repository.AddressRepository;
import com.Ecommerce.E_com.Repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class AddressService {
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressService(AddressRepository addressRepository, UserRepository userRepository){
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AddressResponse addAddress(AddressRequest request, String email) {

        User user = getUserByEmail(email);

        boolean hasExistingAddress = addressRepository.existsByUserId(user.getId());
        boolean shouldBeDefault = request.isDefaultAddress() || !hasExistingAddress;

        if (shouldBeDefault) {
            addressRepository.clearDefaultForUser(user.getId());
        }

        Address address = new Address();
        address.setUser(user);
        address.setFullName(request.getFullName());
        address.setPhone(request.getPhone());
        address.setLine1(request.getLine1());
        address.setLine2(request.getLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPincode(request.getPincode());
        address.setLandmark(request.getLandmark());
        address.setDefaultAddress(shouldBeDefault);

        Address savedAddress = addressRepository.save(address);
        return toResponse(savedAddress);
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> getAddressesForUser(String email) {
        User user = getUserByEmail(email);
        return addressRepository.findByUser_IdOrderByDefaultAddressDescIdDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AddressResponse updateAddress(Long addressId, AddressRequest request, String email) {
        User user = getUserByEmail(email);
        Address address = addressRepository.findByIdAndUser_Id(addressId, user.getId())
                .orElseThrow(() -> new RuntimeException("Address not found."));

        address.setFullName(request.getFullName());
        address.setPhone(request.getPhone());
        address.setLine1(request.getLine1());
        address.setLine2(request.getLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPincode(request.getPincode());
        address.setLandmark(request.getLandmark());

        if (request.isDefaultAddress()) {
            addressRepository.clearDefaultForUser(user.getId());
            address.setDefaultAddress(true);
        } else if (address.isDefaultAddress()) {
            boolean hasAnotherDefaultAddress = addressRepository.findByUser_IdOrderByDefaultAddressDescIdDesc(user.getId())
                    .stream()
                    .anyMatch(item -> !item.getId().equals(address.getId()) && item.isDefaultAddress());
            address.setDefaultAddress(!hasAnotherDefaultAddress);
        } else {
            address.setDefaultAddress(false);
        }

        Address updatedAddress = addressRepository.save(address);
        ensureDefaultAddress(user.getId());
        return toResponse(updatedAddress);
    }

    @Transactional
    public void deleteAddress(Long addressId, String email) {
        User user = getUserByEmail(email);
        Address address = addressRepository.findByIdAndUser_Id(addressId, user.getId())
                .orElseThrow(() -> new RuntimeException("Address not found."));

        addressRepository.delete(address);
        ensureDefaultAddress(user.getId());
    }

    @Transactional
    public AddressResponse setDefaultAddress(Long addressId, String email) {
        User user = getUserByEmail(email);
        Address address = addressRepository.findByIdAndUser_Id(addressId, user.getId())
                .orElseThrow(() -> new RuntimeException("Address not found."));

        addressRepository.clearDefaultForUser(user.getId());
        address.setDefaultAddress(true);
        Address savedAddress = addressRepository.save(address);
        return toResponse(savedAddress);
    }

    private AddressResponse toResponse(Address address) {
        AddressResponse response = new AddressResponse();
        response.setId(address.getId());
        response.setUserId(address.getUser().getId());
        response.setFullName(address.getFullName());
        response.setPhone(address.getPhone());
        response.setLine1(address.getLine1());
        response.setLine2(address.getLine2());
        response.setCity(address.getCity());
        response.setState(address.getState());
        response.setPincode(address.getPincode());
        response.setLandmark(address.getLandmark());
        response.setDefaultAddress(address.isDefaultAddress());
        return response;
    }

    private User getUserByEmail(String email) {
        User user = userRepository.findByEmail(email);

        if (user == null) {
            throw new RuntimeException("User not found.");
        }

        return user;
    }

    private void ensureDefaultAddress(Long userId) {
        boolean hasDefaultAddress = addressRepository.existsByUserIdAndDefaultAddressTrue(userId);
        if (hasDefaultAddress) {
            return;
        }

        addressRepository.findFirstByUser_IdOrderByIdDesc(userId)
                .ifPresent(address -> {
                    address.setDefaultAddress(true);
                    addressRepository.save(address);
                });
    }
}
