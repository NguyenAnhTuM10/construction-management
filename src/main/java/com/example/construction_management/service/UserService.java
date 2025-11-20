package com.example.construction_management.service;


import com.example.construction_management.dto.response.UserResponse;
import com.example.construction_management.entity.User;
import com.example.construction_management.exception.UserNotFoundException;
import com.example.construction_management.mapper.UserMapper;
import com.example.construction_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserResponse getCurrentUser(Authentication authentication)
    {
        String username =  authentication.getName();
        User user = userRepository.findByUsername(username).orElseThrow(()-> new UserNotFoundException("USER NOT FOUND"));
        return userMapper.toUserResponse(user);

    }


}
