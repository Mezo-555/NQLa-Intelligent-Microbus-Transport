export type RecommendationState = 'مقترحة' | 'مرسلة تجريبيًا' | 'قبول تجريبي' | 'رفض تجريبي';
export type FeedbackReviewState = 'بانتظار المراجعة' | 'تم التأكيد تجريبيًا' | 'تم التصحيح تجريبيًا' | 'تم التصعيد تجريبيًا';
export type SafetyReviewState = 'تحتاج مراجعة بشرية' | 'اكتملت المراجعة التجريبية' | 'طلب تصحيح تجريبي';
export type AlertPriority = 'عاجل' | 'مرتفع' | 'متوسط';

export interface AIModelInfo {
  version: string;
  connection: 'غير متصل';
  evaluationStatus: string;
  evaluationNote: string;
  snapshotAt: string;
}

export interface DemandForecast {
  id: string;
  area: string;
  routeName: string;
  window: string;
  predictedRequests: number;
  estimatedFreeSeats: number;
  lowerBound: number;
  upperBound: number;
  gapSeats: number;
  supplyAgeMinutes: number;
  modelVersion: string;
  confidenceLabel: string;
}

export interface ReallocationRecommendation {
  id: string;
  driverId: string;
  driverName: string;
  compatibleRoute: string;
  fromArea: string;
  targetArea: string;
  timeWindow: string;
  freeSeatsAfterMove: number;
  gapBeforeSeats: number;
  residualGapSeats: number;
  incentiveEgp: number;
  eligibility: string[];
  rationale: string;
  state: RecommendationState;
}

export interface FeedbackCase {
  id: string;
  tripId: string;
  passengerLabel: string;
  text: string;
  script: 'عربي مصري' | 'Franco-Arabic';
  sentiment: 'إيجابي' | 'محايد' | 'سلبي';
  category: string;
  confidence: number;
  uncertaintyNote: string;
  createdAt: string;
  state: FeedbackReviewState;
}

export interface SafetyCase {
  id: string;
  driverId: string;
  driverName: string;
  scoreDemo: number;
  scoreScaleNote: string;
  snapshotAt: string;
  uncertainty: string;
  factors: { label: string; description: string; source: string }[];
  reviewReason: string;
  state: SafetyReviewState;
}

export interface AIDemoAlert {
  id: string;
  priority: AlertPriority;
  category: 'فجوة مقاعد' | 'حداثة بيانات' | 'سلامة' | 'مراجعة شكوى';
  title: string;
  description: string;
  source: string;
  ageLabel: string;
  acknowledged: boolean;
}

export interface AIAuditEntry {
  id: string;
  action: string;
  actor: string;
  target: string;
  at: string;
  note: string;
}

export interface DemoPolicySettings {
  shortageThresholdSeats: number;
  staleLocationThresholdMinutes: number;
  effectiveFrom: string;
  version: string;
}

export interface AIAdminSnapshot {
  model: AIModelInfo;
  forecasts: DemandForecast[];
  recommendations: ReallocationRecommendation[];
  feedback: FeedbackCase[];
  safetyCases: SafetyCase[];
  alerts: AIDemoAlert[];
  audit: AIAuditEntry[];
  settings: DemoPolicySettings;
}

export interface AgentReply {
  text: string;
  sources: string[];
  toolsUsed: string[];
  freshness: string;
  uncertainty: string;
  abstained: boolean;
}
