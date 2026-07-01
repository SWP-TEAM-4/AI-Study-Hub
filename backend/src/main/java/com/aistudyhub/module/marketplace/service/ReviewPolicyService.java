package com.aistudyhub.module.marketplace.service;

import com.aistudyhub.common.enums.ReviewPolicyMode;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.SubjectReviewPolicy;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.marketplace.dto.ReviewPolicyResponse;
import com.aistudyhub.module.marketplace.dto.UpdateReviewPolicyRequest;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.SubjectReviewPolicyRepository;
import com.aistudyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class ReviewPolicyService {
    public static final ReviewPolicyMode DEFAULT_MODE = ReviewPolicyMode.SINGLE_REVIEWER;
    public static final int DEFAULT_REQUIRED_VOTES = 1;
    public static final int DEFAULT_APPROVAL_PERCENTAGE = 100;

    private final SubjectReviewPolicyRepository repository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ReviewPolicyResponse resolve(Long subjectId) {
        return repository.findBySubjectIdAndEnabledTrue(subjectId)
                .map(policy -> toResponse(policy, true))
                .orElseGet(() -> ReviewPolicyResponse.builder()
                        .subjectId(subjectId).mode(DEFAULT_MODE).requiredVotes(DEFAULT_REQUIRED_VOTES)
                        .approvalPercentage(DEFAULT_APPROVAL_PERCENTAGE).subjectOverride(false).build());
    }

    @Transactional
    public ReviewPolicyResponse update(Long subjectId, UpdateReviewPolicyRequest request, Long actorId) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
        User actor = userRepository.findById(actorId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        ReviewPolicyMode mode;
        try { mode = ReviewPolicyMode.valueOf(request.getMode().trim().toUpperCase()); }
        catch (Exception ex) { throw new AppException(ErrorCode.VALIDATION_ERROR, "Invalid review policy mode"); }

        int requiredVotes = mode == ReviewPolicyMode.SINGLE_REVIEWER ? 1 : request.getRequiredVotes();
        int approvalPercentage = mode == ReviewPolicyMode.SINGLE_REVIEWER ? 100 : request.getApprovalPercentage();
        if (mode == ReviewPolicyMode.QUORUM && requiredVotes < 2) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "QUORUM requires at least 2 votes");
        }

        SubjectReviewPolicy policy = repository.findBySubjectId(subjectId).orElseGet(SubjectReviewPolicy::new);
        policy.setSubject(subject); policy.setMode(mode); policy.setRequiredVotes(requiredVotes);
        policy.setApprovalPercentage(approvalPercentage); policy.setEnabled(true); policy.setUpdatedBy(actor);
        return toResponse(repository.save(policy), true);
    }

    @Transactional
    public void delete(Long subjectId) {
        repository.findBySubjectId(subjectId).ifPresent(repository::delete);
    }

    private ReviewPolicyResponse toResponse(SubjectReviewPolicy policy, boolean override) {
        return ReviewPolicyResponse.builder().subjectId(policy.getSubject().getId()).mode(policy.getMode())
                .requiredVotes(policy.getRequiredVotes()).approvalPercentage(policy.getApprovalPercentage())
                .subjectOverride(override).build();
    }
}
