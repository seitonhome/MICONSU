import { redirect } from "next/navigation";
import { requireCurrentProfile } from "@/lib/auth/session";
import { getOnboardingContext, computeStepCompletion } from "../_lib/context";
import { clampStep } from "../_lib/steps";
import { suggestedConsentTypesForClassifications } from "@/lib/templates/consent-templates";

import { Step1Datos } from "../_steps/step-1-datos";
import { Step2Marca } from "../_steps/step-2-marca";
import { Step3Practica } from "../_steps/step-3-practica";
import { Step4Profesionales } from "../_steps/step-4-profesionales";
import { Step5Sedes } from "../_steps/step-5-sedes";
import { Step6Servicios } from "../_steps/step-6-servicios";
import { Step7Horarios } from "../_steps/step-7-horarios";
import { Step8Pagos } from "../_steps/step-8-pagos";
import { Step9Consentimientos } from "../_steps/step-9-consentimientos";
import { Step10PaginaPublica } from "../_steps/step-10-pagina-publica";
import { Step11PruebaReserva } from "../_steps/step-11-prueba-reserva";
import { Step12Publicacion } from "../_steps/step-12-publicacion";

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step: rawStep } = await params;
  const step = clampStep(rawStep);

  if (String(step) !== rawStep) {
    redirect(`/onboarding/${step}`);
  }

  const [profile, ctx] = await Promise.all([requireCurrentProfile(), getOnboardingContext()]);

  switch (step) {
    case 1:
      return <Step1Datos clinic={ctx.clinic} />;
    case 2:
      return <Step2Marca branding={ctx.branding} />;
    case 3:
      return <Step3Practica currentType={ctx.clinic.primary_practitioner_type} />;
    case 4:
      return (
        <Step4Profesionales
          professionals={ctx.professionals}
          defaultPractitionerType={ctx.clinic.primary_practitioner_type}
          hasOwnerLinked={ctx.professionals.some((p) => p.profile_id === profile.id)}
        />
      );
    case 5:
      return <Step5Sedes locations={ctx.locations} />;
    case 6:
      return (
        <Step6Servicios
          services={ctx.services}
          hasPractitionerType={Boolean(ctx.clinic.primary_practitioner_type)}
        />
      );
    case 7:
      return <Step7Horarios professionals={ctx.professionals} availabilityRules={ctx.availabilityRules} />;
    case 8:
      return <Step8Pagos paymentProviders={ctx.paymentProviders} />;
    case 9: {
      const classifications = Array.from(new Set(ctx.services.map((s) => s.classification)));
      return (
        <Step9Consentimientos
          consentDocuments={ctx.consentDocuments}
          suggestedTypes={suggestedConsentTypesForClassifications(classifications)}
        />
      );
    }
    case 10:
      return (
        <Step10PaginaPublica slug={ctx.clinic.slug} appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""} />
      );
    case 11:
      return <Step11PruebaReserva slug={ctx.clinic.slug} />;
    case 12:
      return (
        <Step12Publicacion completion={computeStepCompletion(ctx)} isPublished={ctx.clinic.is_published} />
      );
    default:
      redirect("/onboarding/1");
  }
}
