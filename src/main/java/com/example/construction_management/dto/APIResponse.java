package com.example.construction_management.dto;


import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class APIResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private Integer statusCode;

    // --- Constructors ---

    public APIResponse() {
    }

    public APIResponse(boolean success, String message, T data, Integer statusCode) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.statusCode = statusCode;
    }

    public APIResponse(boolean success, String message, T data) {
        this(success, message, data, null);
    }

    public APIResponse(boolean success, String message) {
        this(success, message, null, null);
    }

    // --- Static helper methods (factory methods) ---

    public static <T> APIResponse<T> success(T data, String message) {
        return new APIResponse<>(true, message, data);
    }

    public static <T> APIResponse<T> success(T data) {
        return new APIResponse<>(true, "Success", data);
    }

    public static <T> APIResponse<T> success(String message) {
        return new APIResponse<>(true, message, null);
    }

    public static <T> APIResponse<T> error(String message) {
        return new APIResponse<>(false, message, null);
    }

    public static <T> APIResponse<T> error(String message, Integer statusCode) {
        return new APIResponse<>(false, message, null, statusCode);
    }

    // --- Getters and Setters ---

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public Integer getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(Integer statusCode) {
        this.statusCode = statusCode;
    }
}

