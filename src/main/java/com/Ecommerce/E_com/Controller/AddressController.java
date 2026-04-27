package com.Ecommerce.E_com.Controller;

import com.Ecommerce.E_com.Dto.AddressRequest;
import com.Ecommerce.E_com.Dto.AddressResponse;
import com.Ecommerce.E_com.Service.AddressService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService){
        this.addressService = addressService;
    }

    @PostMapping
    public AddressResponse addAddress(@RequestBody AddressRequest request, Principal principal){
        return addressService.addAddress(request, principal.getName());
    }

    @GetMapping
    public List<AddressResponse> getMyAddresses(Principal principal) {
        return addressService.getAddressesForUser(principal.getName());
    }

    @PutMapping("/{id}")
    public AddressResponse updateAddress(
            @PathVariable Long id,
            @RequestBody AddressRequest request,
            Principal principal
    ) {
        return addressService.updateAddress(id, request, principal.getName());
    }

    @DeleteMapping("/{id}")
    public void deleteAddress(@PathVariable Long id, Principal principal) {
        addressService.deleteAddress(id, principal.getName());
    }

    @PatchMapping("/{id}/default")
    public AddressResponse setDefaultAddress(@PathVariable Long id, Principal principal) {
        return addressService.setDefaultAddress(id, principal.getName());
    }
}
