"use client";

import { apiFetch } from "./client";

export interface FeedbackAlert {
  id: string;
  appointmentId: string;
  employeeId: string;
  patientId: string;
  overallRating: number;
  woreGloves: boolean;
  woreMask: boolean;
  wasPunctual: boolean;
  wasProfessional: boolean;
  comment?: string | null;
  createdAt: string;
  patientFirstName: string;
  employeeName: string | null;
  employee?: {
    id: string;
    user: { id: string; name: string };
  };
}

export interface LeaderboardEntry {
  employeeId: string;
  name: string;
  averageRating: number;
  totalFeedbackCount: number;
}

export interface EmployeeFeedbackStats {
  employee: { id: string; name: string; email: string };
  averageRating: number;
  totalFeedbackCount: number;
  ratingBreakdown: {
    "5star": number;
    "4star": number;
    "3star": number;
    "2star": number;
    "1star": number;
  };
  hygieneComplianceRate: number;
  punctualityRate: number;
  professionalismRate: number;
  recentFeedback: {
    id: string;
    appointmentId: string;
    overallRating: number;
    woreGloves: boolean;
    woreMask: boolean;
    wasPunctual: boolean;
    wasProfessional: boolean;
    comment?: string | null;
    createdAt: string;
    patientFirstName: string;
  }[];
}

export interface FeedbackEntry {
  id: string;
  appointmentId: string;
  employeeId: string;
  patientId: string;
  overallRating: number;
  woreGloves: boolean;
  woreMask: boolean;
  wasPunctual: boolean;
  wasProfessional: boolean;
  comment?: string | null;
  createdAt: string;
  patientFirstName: string;
  employeeName: string | null;
}

export interface FeedbackAllResponse {
  data: FeedbackEntry[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  message: string;
  success: boolean;
}

export function getFeedbackAlerts() {
  return apiFetch<FeedbackAlert[]>("/feedback/alerts");
}

export function getFeedbackLeaderboard() {
  return apiFetch<LeaderboardEntry[]>("/feedback/leaderboard");
}

export function getEmployeeFeedbackStats(employeeId: string) {
  return apiFetch<EmployeeFeedbackStats>(`/feedback/employee/${employeeId}`);
}

export function getAllFeedback(params: {
  minRating?: number;
  maxRating?: number;
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const query = qs.toString();
  return apiFetch<FeedbackEntry[]>(`/feedback/all${query ? `?${query}` : ""}`);
}
