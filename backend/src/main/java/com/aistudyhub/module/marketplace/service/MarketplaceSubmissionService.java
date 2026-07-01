package com.aistudyhub.module.marketplace.service;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.*;
import com.aistudyhub.module.marketplace.dto.ReviewPolicyResponse;
import com.aistudyhub.repository.MarketplaceSubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class MarketplaceSubmissionService {
    private final MarketplaceSubmissionRepository repository;
    private final ReviewPolicyService policyService;

    @Transactional
    public MarketplaceSubmission create(String targetType, Long targetId, Subject subject, User owner, String note) {
        MarketplaceSubmission latest = repository
                .findFirstByTargetTypeAndTargetIdOrderBySubmissionRoundDesc(targetType, targetId).orElse(null);
        if (latest != null && latest.getStatus() == MarketStatus.PENDING) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Content already has a pending submission");
        }
        if (latest != null && latest.getStatus() == MarketStatus.APPROVED) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Approved content cannot be submitted again");
        }
        ReviewPolicyResponse policy = policyService.resolve(subject.getId());
        return repository.save(MarketplaceSubmission.builder()
                .targetType(targetType).targetId(targetId).subject(subject).owner(owner)
                .submissionRound(latest == null ? 1 : latest.getSubmissionRound() + 1)
                .status(MarketStatus.PENDING).policyModeSnapshot(policy.getMode())
                .requiredVotesSnapshot(policy.getRequiredVotes())
                .approvalPercentageSnapshot(policy.getApprovalPercentage()).submitNote(note).build());
    }

    @Transactional
    public MarketplaceSubmission getOrCreateLegacyPending(String type, Long targetId, Subject subject, User owner) {
        return repository.findFirstByTargetTypeAndTargetIdAndStatusOrderBySubmissionRoundDesc(type, targetId, MarketStatus.PENDING)
                .orElseGet(() -> {
                    ReviewPolicyResponse policy = policyService.resolve(subject.getId());
                    MarketplaceSubmission latest = repository.findFirstByTargetTypeAndTargetIdOrderBySubmissionRoundDesc(type, targetId).orElse(null);
                    return repository.save(MarketplaceSubmission.builder().targetType(type).targetId(targetId)
                            .subject(subject).owner(owner).submissionRound(latest == null ? 1 : latest.getSubmissionRound() + 1)
                            .status(MarketStatus.PENDING).policyModeSnapshot(policy.getMode())
                            .requiredVotesSnapshot(policy.getRequiredVotes())
                            .approvalPercentageSnapshot(policy.getApprovalPercentage()).build());
                });
    }

    @Transactional(readOnly = true)
    public MarketplaceSubmission findPending(String type, Long targetId) {
        return repository.findFirstByTargetTypeAndTargetIdAndStatusOrderBySubmissionRoundDesc(type, targetId, MarketStatus.PENDING)
                .orElseThrow(() -> new AppException(ErrorCode.VALIDATION_ERROR, "No pending marketplace submission"));
    }
}
