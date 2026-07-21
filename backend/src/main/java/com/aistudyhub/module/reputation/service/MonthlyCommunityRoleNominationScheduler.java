package com.aistudyhub.module.reputation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MonthlyCommunityRoleNominationScheduler {

    private final CommunityRoleNominationService communityRoleNominationService;

    @Scheduled(cron = "0 15 0 1 * *")
    public void generatePreviousMonthNominations() {
        try {
            int created = communityRoleNominationService.generateMonthlyNominations(null).size();
            log.info("Generated {} community role nominations for previous month", created);
        } catch (Exception ex) {
            log.warn("Failed to generate monthly community role nominations: {}", ex.getMessage());
        }
    }
}
