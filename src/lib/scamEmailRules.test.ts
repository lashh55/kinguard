/// <reference types="bun" />
import { describe, expect, it } from "bun:test";
import { applySeasonalRules, inspectEmailLinks, isGovernmentAddress, seasonalWarnings } from "./scamEmailRules";

describe("seasonal enrollment warnings", () => {
  for (const phrase of ["open enrollment", "Medicare plan", "benefits card", "free rebate", "medical discount card"]) {
    it(`flags ${phrase} without automatically declaring high risk`, () => {
      const result = applySeasonalRules({ score: 10, urgency: "low", flags: [], flags_es: [] }, phrase);
      expect(result.flags.length).toBe(1);
      expect(result.flags_es.length).toBe(1);
      expect(result.score).toBe(10);
    });
  }
  for (const phrase of ["Provide your Medicare number", "Send your Social Security number", "Enter your bank information", "immediate sign-up"]) {
    it(`flags ${phrase}`, () => expect(seasonalWarnings(phrase).sensitiveRequest).toBe(true));
  }
});

describe("prize payment risk", () => {
  for (const fee of ["taxes", "shipping", "processing", "insurance", "release fee"]) {
    it(`enforces high risk for ${fee} even using a real charity name`, () => {
      const result = applySeasonalRules({ score: 15, urgency: "low", flags: [], flags_es: [] }, `The Red Cross says you won a prize. Pay the ${fee} to receive it.`);
      expect(result.score).toBe(75);
      expect(result.urgency).toBe("high");
      expect(result.flags.length).toBe(1);
      expect(result.flags_es.length).toBe(1);
    });
  }
  it("preserves a critical score", () => {
    expect(applySeasonalRules({ score: 95, urgency: "critical", flags: [], flags_es: [] }, "Pay shipping for your prize").urgency).toBe("critical");
  });
  it("applies the same high-risk floor in Spanish", () => {
    expect(applySeasonalRules({ score: 5, urgency: "low", flags: [], flags_es: [] }, "Pague los impuestos para recibir su premio").score).toBe(75);
  });
});

describe("real email destinations", () => {
  it("keeps the full hidden href even with a plain-text email alternative", () => {
    const { links } = inspectEmailLinks("Review your Medicare plan", '<a href="https://medicare.gov.example.com/enroll?source=email&amp;step=2">Medicare.gov</a>');
    expect(links).toEqual([{ address: "https://medicare.gov.example.com/enroll?source=email&step=2", government_warning: true }]);
  });
  it("shows every unique link, not just the displayed label", () => {
    expect(inspectEmailLinks("", '<a href="https://one.example/a">Click</a><a href="https://two.example/b">Click</a>').links.map(l => l.address)).toEqual(["https://one.example/a", "https://two.example/b"]);
  });
  it("does not confuse .gov inside a path or hostname with a .gov ending", () => {
    expect(isGovernmentAddress("https://example.com/irs.gov")).toBe(false);
    expect(isGovernmentAddress("https://irs.gov.example.com")).toBe(false);
    expect(isGovernmentAddress("https://www.medicare.gov/plan?x=1")).toBe(true);
  });
  it("does not warn that a true .gov hostname has a non-gov ending", () => {
    expect(inspectEmailLinks("Federal government: https://www.medicare.gov/plan").links[0]?.government_warning).toBe(false);
  });
  it("flags Spanish government claims", () => {
    expect(inspectEmailLinks("El gobierno le pide registrarse en https://example.com/seguro").links[0]?.government_warning).toBe(true);
  });
  it("excludes executable schemes and duplicate destinations", () => {
    expect(inspectEmailLinks("", '<a href="javascript:alert(1)">Government</a><a href="https://example.com/a">One</a><a href="https://example.com/a">Two</a>').links).toHaveLength(1);
  });
});