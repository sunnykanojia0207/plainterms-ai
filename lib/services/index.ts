/**
 * Service contracts barrel. UI and routes import service *interfaces*
 * from here. Concrete implementations arrive in later milestones and
 * are wired without touching consumers.
 */
export type { DocumentListFilter, DocumentService } from "./document-service";
export type { AIService, DocumentSummary } from "./ai-service";
export type { ComparisonService } from "./comparison-service";
export type { ReviewService } from "./review-service";
export type { ActionPackExportFormat, ActionPackService } from "./action-pack-service";
export { ServiceError, ServiceNotImplementedError } from "./service-error";
