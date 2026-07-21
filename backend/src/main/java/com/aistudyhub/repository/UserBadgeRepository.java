package com.aistudyhub.repository;

import com.aistudyhub.entity.UserBadge;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

    boolean existsByUser_IdAndBadge_Id(Long userId, Long badgeId);

    @EntityGraph(attributePaths = "badge")
    List<UserBadge> findAllByUser_IdOrderByEarnedAtDescIdDesc(Long userId);

    @EntityGraph(attributePaths = { "user", "badge" })
    List<UserBadge> findAllByUser_IdInOrderByEarnedAtDescIdDesc(Collection<Long> userIds);
}
