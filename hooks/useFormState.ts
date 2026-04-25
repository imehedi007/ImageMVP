"use client";

import { useMemo, useState } from "react";

import { RideFormData } from "@/types";

const initialData: RideFormData = {
  name: "",
  dateOfBirth: "",
  ageRange: "",
  phone: "",
  vibe: "",
  bikeType: "Neo Cafe",
  environment: "city",
  favoriteColor: "#FF6B35",
  behavior: "stay"
};

export function useFormState(totalSteps: number) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<RideFormData>(initialData);

  const progress = useMemo(() => ((step + 1) / totalSteps) * 100, [step, totalSteps]);

  function update<K extends keyof RideFormData>(key: K, value: RideFormData[K]) {
    setData((current) => ({ ...current, [key]: value }));
  }

  function next() {
    setStep((current) => Math.min(current + 1, totalSteps - 1));
  }

  function back() {
    setStep((current) => Math.max(current - 1, 0));
  }

  function reset() {
    setStep(0);
    setData(initialData);
  }

  return {
    data,
    progress,
    step,
    update,
    next,
    back,
    reset,
    setData,
    setStep
  };
}
