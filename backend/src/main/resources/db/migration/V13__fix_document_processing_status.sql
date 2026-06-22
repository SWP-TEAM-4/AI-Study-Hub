-- Fix invalid 'COMPLETED' processing_status values to 'SUCCESS' to align with com.aistudyhub.common.enums.ProcessingStatus
UPDATE documents
SET processing_status = 'SUCCESS'
WHERE processing_status = 'COMPLETED';