package com.semantic.gateway.validation;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = MaxPromptLengthValidator.class)
@Documented
public @interface MaxPromptLength {
    String message() default "prompt exceeds the maximum allowed length";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
