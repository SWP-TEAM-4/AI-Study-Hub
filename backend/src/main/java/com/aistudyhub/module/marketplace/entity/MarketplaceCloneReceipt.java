package com.aistudyhub.module.marketplace.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.aistudyhub.entity.User;
import com.aistudyhub.module.marketplace.model.MarketplaceCloneTargetType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "marketplace_clone_receipts",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_marketplace_clone_receipts_user_target_source",
                columnNames = { "user_id", "target_type", "source_id" }),
        indexes = {
                @Index(name = "idx_marketplace_clone_receipts_user", columnList = "user_id"),
                @Index(name = "idx_marketplace_clone_receipts_target", columnList = "target_type, source_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceCloneReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 40)
    private MarketplaceCloneTargetType targetType;

    @Column(name = "source_id", nullable = false)
    private Long sourceId;

    @Column(name = "cloned_resource_id")
    private Long clonedResourceId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
