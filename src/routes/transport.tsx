import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Bus, CheckCircle2, Clock, XCircle, Loader2, X } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/transport")({
  component: () => (
    <PhoneFrame>
      <AppShell>
        <Transport />
      </AppShell>
    </PhoneFrame>
  ),
});

type TransportSite = "Potsdam site" | "Chiselhurst site";
type PaymentForm = "NSFAS" | "Bursary" | "Upfront Payment";
type DocType =
  | "id"
  | "proof_of_registration"
  | "bursary_proof"
  | "residence_proof"
  | "nsfas_proof"
  | "payment_proof";

type ProfileData = {
  full_name: string;
  student_number: string;
  email: string;
  course: string;
  campus: string;
};

type Application = {
  id: string;
  transport_site: TransportSite;
  surname: string;
  first_names: string;
  title: string;
  student_number: string;
  date_of_application: string;
  date_of_birth: string;
  citizenship: string;
  cell_no: string;
  email_address: string;
  residence_name: string;
  guardian_surname: string;
  guardian_first_names: string;
  guardian_title: string;
  guardian_tel_home: string | null;
  guardian_tel_work: string | null;
  guardian_tel_cell: string;
  guardian_postal_address: string;
  guardian_email_address: string | null;
  proposed_course_of_study: string;
  special_treatment: boolean;
  physical_disabilities_particulars: string | null;
  form_of_payment: PaymentForm;
  id_document_url: string;
  proof_of_registration_url: string;
  bursary_proof_url: string | null;
  residence_proof_url: string | null;
  nsfas_proof_url: string | null;
  payment_proof_url: string | null;
  declaration_accepted: boolean;
  signature_name: string;
  signature_date: string;
  status: string;
  rejection_reason?: string | null;
  created_at: string;
  reviewed_at: string | null;
  valid_until: string | null;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const todayISO = new Date().toISOString().split("T")[0];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateDocumentFile(file: File, label: string) {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`${label} must be a PDF, JPG, PNG, or WEBP file.`);
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${label} must be 5 MB or smaller.`);
  }
}

async function uploadTransportDocument(
  userId: string,
  file: File,
  docType: DocType
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${userId}/${docType}_${Date.now()}_${safeName}`;

  const { error } = await supabase.storage
    .from("transport-documents")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Failed to upload ${docType.replace(/_/g, " ")}: ${error.message}`
    );
  }

  return filePath;
}

function isExpired(validUntil: string | null) {
  if (!validUntil) return false;
  return new Date(validUntil) < new Date(new Date().toDateString());
}

function canReapply(app: Application | null) {
  if (!app) return true;
  if (app.status === "rejected") return true;
  if (app.status === "approved" && isExpired(app.valid_until)) return true;
  return false;
}

export default function Transport() {
  return <TransportInner />;
}

function statusStyle(status: string) {
  switch (status) {
    case "approved":
      return {
        icon: CheckCircle2,
        tone: "bg-success/15 text-success",
        label: "Approved",
      };
    case "rejected":
      return {
        icon: XCircle,
        tone: "bg-destructive/15 text-destructive",
        label: "Rejected",
      };
    default:
      return {
        icon: Clock,
        tone: "bg-muted text-muted-foreground",
        label: "Pending review",
      };
  }
}

function SelectedFileBadge({
  file,
  onClear,
}: {
  file: File | null;
  onClear: () => void;
}) {
  if (!file) return null;
  return (
    <div className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-2.5 py-1 text-[11px] text-muted-foreground">
      <span className="truncate">
        {file.name} ({formatFileSize(file.size)})
      </span>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex shrink-0 items-center gap-0.5 font-medium text-foreground hover:text-destructive"
      >
        <X className="h-3 w-3" />
        Clear
      </button>
    </div>
  );
}

function TransportInner() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Site & Applicant particulars
  const [transportSite, setTransportSite] = useState<TransportSite>("Chiselhurst site");
  const [title, setTitle] = useState("Mr");
  const [surname, setSurname] = useState("");
  const [firstNames, setFirstNames] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [dateOfApplication, setDateOfApplication] = useState(todayISO);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [citizenship, setCitizenship] = useState("South African");
  const [cellNo, setCellNo] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [residenceName, setResidenceName] = useState("");

  // Guardian / Parent particulars
  const [guardianTitle, setGuardianTitle] = useState("Mr");
  const [guardianSurname, setGuardianSurname] = useState("");
  const [guardianFirstNames, setGuardianFirstNames] = useState("");
  const [guardianTelHome, setGuardianTelHome] = useState("");
  const [guardianTelWork, setGuardianTelWork] = useState("");
  const [guardianTelCell, setGuardianTelCell] = useState("");
  const [guardianPostalAddress, setGuardianPostalAddress] = useState("");
  const [guardianEmailAddress, setGuardianEmailAddress] = useState("");

  // Academic information
  const [proposedCourseOfStudy, setProposedCourseOfStudy] = useState("");

  // Special treatment, disability details & payment
  const [specialTreatment, setSpecialTreatment] = useState<"NO" | "YES">("NO");
  const [disabilitiesParticulars, setDisabilitiesParticulars] = useState("");
  const [formOfPayment, setFormOfPayment] = useState<PaymentForm>("NSFAS");

  // Supporting documents & declaration
  const [idFile, setIdFile] = useState<File | null>(null);
  const [proofOfRegFile, setProofOfRegFile] = useState<File | null>(null);
  const [bursaryProofFile, setBursaryProofFile] = useState<File | null>(null);
  const [residenceProofFile, setResidenceProofFile] = useState<File | null>(null);
  const [nsfasProofFile, setNsfasProofFile] = useState<File | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);

  const idInputRef = useRef<HTMLInputElement | null>(null);
  const proofInputRef = useRef<HTMLInputElement | null>(null);
  const bursaryInputRef = useRef<HTMLInputElement | null>(null);
  const residenceInputRef = useRef<HTMLInputElement | null>(null);
  const nsfasInputRef = useRef<HTMLInputElement | null>(null);
  const paymentInputRef = useRef<HTMLInputElement | null>(null);

  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signatureDate, setSignatureDate] = useState(todayISO);

  const isNsfasRequired = formOfPayment === "NSFAS";
  const isBursaryRequired = formOfPayment === "Bursary";
  const isPaymentProofRequired = formOfPayment === "Upfront Payment";

  const clearFile = (
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    ref: React.RefObject<HTMLInputElement | null>
  ) => {
    setter(null);
    if (ref.current) ref.current.value = "";
  };

  const handlePaymentMethodChange = (val: PaymentForm) => {
    setFormOfPayment(val);
    if (val !== "NSFAS") {
      clearFile(setNsfasProofFile, nsfasInputRef);
    }
    if (val !== "Bursary") {
      clearFile(setBursaryProofFile, bursaryInputRef);
    }
    if (val !== "Upfront Payment") {
      clearFile(setPaymentProofFile, paymentInputRef);
    }
  };

  const applyProfileDefaults = useCallback(
    (prof: ProfileData | null, fallbackEmail: string) => {
      if (prof?.full_name) {
        const parts = prof.full_name.trim().split(/\s+/);
        if (parts.length > 1) {
          setSurname(parts[parts.length - 1]);
          setFirstNames(parts.slice(0, -1).join(" "));
        } else {
          setFirstNames(parts[0]);
          setSurname("");
        }
      } else {
        setFirstNames("");
        setSurname("");
      }

      setStudentNumber(prof?.student_number || "");
      setProposedCourseOfStudy(prof?.course || "");
      setEmailAddress(prof?.email || fallbackEmail || "");

      if (prof?.campus) {
        const lowerCampus = prof.campus.toLowerCase();
        if (lowerCampus.includes("potsdam")) {
          setTransportSite("Potsdam site");
        } else if (lowerCampus.includes("chiselhurst")) {
          setTransportSite("Chiselhurst site");
        } else {
          setTransportSite("Chiselhurst site");
        }
      } else {
        setTransportSite("Chiselhurst site");
      }
    },
    []
  );

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const userEmail = user.email || "";
      setAuthEmail(userEmail);

      const [{ data: profileData }, { data: appData, error: appError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, student_number, email, course, campus")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("transport_applications")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1),
        ]);

      if (profileData) {
        setProfile(profileData);
      }
      applyProfileDefaults(profileData, userEmail);

      if (!appError) {
        setApplication(((appData?.[0] as unknown) as Application) ?? null);
      }
    }

    setLoading(false);
  }, [applyProfileDefaults]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setTitle("Mr");
    setDateOfApplication(todayISO);
    setDateOfBirth("");
    setCitizenship("South African");
    setCellNo("");
    setResidenceName("");
    setGuardianTitle("Mr");
    setGuardianSurname("");
    setGuardianFirstNames("");
    setGuardianTelHome("");
    setGuardianTelWork("");
    setGuardianTelCell("");
    setGuardianPostalAddress("");
    setGuardianEmailAddress("");
    setSpecialTreatment("NO");
    setDisabilitiesParticulars("");
    setFormOfPayment("NSFAS");
    clearFile(setIdFile, idInputRef);
    clearFile(setProofOfRegFile, proofInputRef);
    clearFile(setBursaryProofFile, bursaryInputRef);
    clearFile(setResidenceProofFile, residenceInputRef);
    clearFile(setNsfasProofFile, nsfasInputRef);
    clearFile(setPaymentProofFile, paymentInputRef);
    setDeclarationAccepted(false);
    setSignatureName("");
    setSignatureDate(todayISO);
    applyProfileDefaults(profile, authEmail);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idFile) {
      toast.error("Please upload a certified ID copy.");
      return;
    }

    if (!proofOfRegFile) {
      toast.error("Please upload proof of registration.");
      return;
    }

    if (isBursaryRequired && !bursaryProofFile) {
      toast.error("Please upload proof of bursary acceptance.");
      return;
    }

    if (isNsfasRequired && !nsfasProofFile) {
      toast.error("Please upload proof of NSFAS funding.");
      return;
    }

    if (isPaymentProofRequired && !paymentProofFile) {
      toast.error("Please upload proof of payment.");
      return;
    }

    if (!declarationAccepted) {
      toast.error("Please accept the applicant declaration before submitting.");
      return;
    }

    if (!signatureName.trim()) {
      toast.error("Please enter your signature name to confirm the declaration.");
      return;
    }

    setSubmitting(true);
    const uploadedPaths: string[] = [];

    try {
      validateDocumentFile(idFile, "Certified ID copy");
      validateDocumentFile(proofOfRegFile, "Proof of registration");
      if (isBursaryRequired && bursaryProofFile) {
        validateDocumentFile(bursaryProofFile, "Proof of bursary acceptance");
      }
      if (residenceProofFile) {
        validateDocumentFile(residenceProofFile, "Proof of residence acceptance");
      }
      if (isNsfasRequired && nsfasProofFile) {
        validateDocumentFile(nsfasProofFile, "Proof of NSFAS funding");
      }
      if (isPaymentProofRequired && paymentProofFile) {
        validateDocumentFile(paymentProofFile, "Proof of payment");
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in to submit an application.");
      }

      const uploadedIdPath = await uploadTransportDocument(user.id, idFile, "id");
      uploadedPaths.push(uploadedIdPath);

      const uploadedProofPath = await uploadTransportDocument(
        user.id,
        proofOfRegFile,
        "proof_of_registration"
      );
      uploadedPaths.push(uploadedProofPath);

      let uploadedBursaryPath: string | null = null;
      if (isBursaryRequired && bursaryProofFile) {
        uploadedBursaryPath = await uploadTransportDocument(
          user.id,
          bursaryProofFile,
          "bursary_proof"
        );
        uploadedPaths.push(uploadedBursaryPath);
      }

      let uploadedResidencePath: string | null = null;
      if (residenceProofFile) {
        uploadedResidencePath = await uploadTransportDocument(
          user.id,
          residenceProofFile,
          "residence_proof"
        );
        uploadedPaths.push(uploadedResidencePath);
      }

      let uploadedNsfasPath: string | null = null;
      if (isNsfasRequired && nsfasProofFile) {
        uploadedNsfasPath = await uploadTransportDocument(
          user.id,
          nsfasProofFile,
          "nsfas_proof"
        );
        uploadedPaths.push(uploadedNsfasPath);
      }

      let uploadedPaymentPath: string | null = null;
      if (isPaymentProofRequired && paymentProofFile) {
        uploadedPaymentPath = await uploadTransportDocument(
          user.id,
          paymentProofFile,
          "payment_proof"
        );
        uploadedPaths.push(uploadedPaymentPath);
      }

      const payload = {
        user_id: user.id,
        transport_site: transportSite,
        title: title.trim(),
        surname: surname.trim(),
        first_names: firstNames.trim(),
        student_number: studentNumber.trim(),
        date_of_application: dateOfApplication,
        date_of_birth: dateOfBirth,
        citizenship: citizenship.trim(),
        cell_no: cellNo.trim(),
        email_address: emailAddress.trim(),
        residence_name: residenceName.trim(),
        guardian_title: guardianTitle.trim(),
        guardian_surname: guardianSurname.trim(),
        guardian_first_names: guardianFirstNames.trim(),
        guardian_tel_home: guardianTelHome.trim() || null,
        guardian_tel_work: guardianTelWork.trim() || null,
        guardian_tel_cell: guardianTelCell.trim(),
        guardian_postal_address: guardianPostalAddress.trim(),
        guardian_email_address: guardianEmailAddress.trim() || null,
        proposed_course_of_study: proposedCourseOfStudy.trim(),
        special_treatment: specialTreatment === "YES",
        physical_disabilities_particulars: disabilitiesParticulars.trim() || null,
        form_of_payment: formOfPayment,
        id_document_url: uploadedIdPath,
        proof_of_registration_url: uploadedProofPath,
        bursary_proof_url: uploadedBursaryPath,
        residence_proof_url: uploadedResidencePath,
        nsfas_proof_url: uploadedNsfasPath,
        payment_proof_url: uploadedPaymentPath,
        declaration_accepted: declarationAccepted,
        signature_name: signatureName.trim(),
        signature_date: signatureDate,
      };

      const { data: row, error } = await supabase
        .from("transport_applications")
        .insert(payload as never)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || "Could not submit your application.");
      }

      setApplication((row as unknown) as Application);
      setShowForm(false);
      resetForm();
      toast.success("Application submitted");
    } catch (err) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("transport-documents").remove(uploadedPaths);
      }
      toast.error(
        (err as Error).message || "Could not submit your application. Please try again."
      );
      void load();
    } finally {
      setSubmitting(false);
    }
  };

  const status = application ? statusStyle(application.status) : null;
  const eligible = canReapply(application);

  return (
    <div className="pb-6">
      <header className="bg-gradient-card px-5 pt-12 pb-8 text-primary-foreground">
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-semibold">Transport</h1>
          <div className="w-10" />
        </div>
        <div className="mt-5 h-[76px]" />
      </header>

      <div className="px-5 mt-5 space-y-4">
        {loading ? (
          <div className="rounded-2xl bg-card p-8 shadow-soft flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : application && (!showForm || !eligible) ? (
          <div className="rounded-2xl bg-card p-5 shadow-card space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Your application</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submitted {new Date(application.created_at).toLocaleDateString()}
                </p>
              </div>
              {status && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.tone}`}
                >
                  <status.icon className="h-3.5 w-3.5" /> {status.label}
                </span>
              )}
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Site</dt>
                <dd className="text-right font-medium">{application.transport_site}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Applicant</dt>
                <dd className="text-right font-medium">
                  {application.title} {application.first_names} {application.surname}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Student No.</dt>
                <dd className="text-right font-medium">{application.student_number}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Residence</dt>
                <dd className="text-right font-medium">{application.residence_name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Course</dt>
                <dd className="text-right font-medium">{application.proposed_course_of_study}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Payment</dt>
                <dd className="text-right font-medium">{application.form_of_payment}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Special treatment</dt>
                <dd className="text-right font-medium">
                  {application.special_treatment ? "YES" : "NO"}
                </dd>
              </div>
              {application.physical_disabilities_particulars && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Disability details</dt>
                  <dd className="text-right font-medium">
                    {application.physical_disabilities_particulars}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Certified ID</dt>
                <dd className="text-right font-medium">Uploaded</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Proof of registration</dt>
                <dd className="text-right font-medium">Uploaded</dd>
              </div>
              {application.bursary_proof_url && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Proof of bursary acceptance</dt>
                  <dd className="text-right font-medium">Uploaded</dd>
                </div>
              )}
              {application.residence_proof_url && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Proof of residence acceptance</dt>
                  <dd className="text-right font-medium">Uploaded</dd>
                </div>
              )}
              {application.nsfas_proof_url && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Proof of NSFAS funding</dt>
                  <dd className="text-right font-medium">Uploaded</dd>
                </div>
              )}
              {application.payment_proof_url && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Proof of payment</dt>
                  <dd className="text-right font-medium">Uploaded</dd>
                </div>
              )}
              {application.reviewed_at && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Reviewed</dt>
                  <dd className="text-right font-medium">
                    {new Date(application.reviewed_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {application.status === "approved" &&
                application.valid_until &&
                !isExpired(application.valid_until) && (
                  <div className="rounded-xl bg-success/10 px-3 py-2.5 text-xs text-success space-y-0.5">
                    <p className="font-semibold">Pass Active</p>
                    <p>
                      Your transport application is valid until{" "}
                      {new Date(application.valid_until).toLocaleDateString()}.
                    </p>
                  </div>
                )}
              {application.status === "approved" && isExpired(application.valid_until) && (
                <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Your transport pass has expired. You may apply again.
                </p>
              )}
              {application.status === "rejected" && (
                <div className="rounded-xl bg-destructive/10 px-3 py-2.5 text-xs text-destructive space-y-1">
                  <p className="font-semibold">Your previous application was not approved.</p>
                  {application.rejection_reason ? (
                    <p className="text-foreground/90">
                      Reason: {application.rejection_reason}
                    </p>
                  ) : null}
                  <p className="text-muted-foreground">You may submit a new application.</p>
                </div>
              )}
            </dl>
            {application.status !== "approved" && application.status !== "rejected" && (
              <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                Your application is awaiting review. You can apply again once it has been decided.
              </p>
            )}

            {eligible && (
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={() => setShowForm(true)}
              >
                New application
              </Button>
            )}
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="rounded-2xl bg-card p-5 shadow-soft space-y-5"
          >
            <div>
              <h2 className="font-semibold">Apply for transport</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                EduCard Transport Application — student card details are pre-filled and editable.
              </p>
            </div>

            {/* Site Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs">Transport site *</Label>
              <Select
                value={transportSite}
                onValueChange={(val) => setTransportSite(val as TransportSite)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Potsdam site">Potsdam site</SelectItem>
                  <SelectItem value="Chiselhurst site">Chiselhurst site</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* (a) Applicant's Particulars */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                (a) Applicant&apos;s Particulars
              </h3>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Title *</Label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Mr / Ms"
                    className="h-10"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Surname *</Label>
                  <Input
                    required
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">First names *</Label>
                <Input
                  required
                  value={firstNames}
                  onChange={(e) => setFirstNames(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Student number *</Label>
                  <Input
                    required
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date of application *</Label>
                  <Input
                    type="date"
                    required
                    value={dateOfApplication}
                    onChange={(e) => setDateOfApplication(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Date of birth *</Label>
                  <Input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Citizenship *</Label>
                  <Input
                    required
                    value={citizenship}
                    onChange={(e) => setCitizenship(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Cell no. *</Label>
                <Input
                  type="tel"
                  required
                  value={cellNo}
                  onChange={(e) => setCellNo(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">E-mail address *</Label>
                <Input
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Residence name *</Label>
                <Input
                  required
                  value={residenceName}
                  onChange={(e) => setResidenceName(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            {/* (b) Guardian or Parent's Particulars */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                (b) Guardian or Parent&apos;s Particulars
              </h3>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Title *</Label>
                  <Input
                    required
                    value={guardianTitle}
                    onChange={(e) => setGuardianTitle(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Surname *</Label>
                  <Input
                    required
                    value={guardianSurname}
                    onChange={(e) => setGuardianSurname(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">First names *</Label>
                <Input
                  required
                  value={guardianFirstNames}
                  onChange={(e) => setGuardianFirstNames(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tel (H)</Label>
                  <Input
                    type="tel"
                    value={guardianTelHome}
                    onChange={(e) => setGuardianTelHome(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tel (W)</Label>
                  <Input
                    type="tel"
                    value={guardianTelWork}
                    onChange={(e) => setGuardianTelWork(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tel (C) *</Label>
                  <Input
                    type="tel"
                    required
                    value={guardianTelCell}
                    onChange={(e) => setGuardianTelCell(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Postal address *</Label>
                <Input
                  required
                  value={guardianPostalAddress}
                  onChange={(e) => setGuardianPostalAddress(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">E-mail address</Label>
                <Input
                  type="email"
                  value={guardianEmailAddress}
                  onChange={(e) => setGuardianEmailAddress(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            {/* (c) Academic Information */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                (c) Academic Information
              </h3>
              <div className="space-y-1">
                <Label className="text-xs">Proposed course of study *</Label>
                <Input
                  required
                  value={proposedCourseOfStudy}
                  onChange={(e) => setProposedCourseOfStudy(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            {/* Special Treatment, Disability Details & Payment */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Disability &amp; Payment
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Disability *</Label>
                  <Select
                    value={specialTreatment}
                    onValueChange={(val) => setSpecialTreatment(val as "NO" | "YES")}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NO">NO</SelectItem>
                      <SelectItem value="YES">YES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Form of payment *</Label>
                  <Select
                    value={formOfPayment}
                    onValueChange={(val) => handlePaymentMethodChange(val as PaymentForm)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NSFAS">NSFAS</SelectItem>
                      <SelectItem value="Bursary">Bursary</SelectItem>
                      <SelectItem value="Upfront Payment">Upfront Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Particulars of physical disabilities, if any</Label>
                <Input
                  value={disabilitiesParticulars}
                  onChange={(e) => setDisabilitiesParticulars(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            {/* Supporting Documents & Declaration */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Documents &amp; Declaration
              </h3>

              <div className="space-y-1">
                <Label className="text-xs">Certified ID copy (PDF, JPG, PNG, WEBP, max 5 MB) *</Label>
                <Input
                  ref={idInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  required
                  onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
                  className="h-10 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-primary"
                />
                <SelectedFileBadge
                  file={idFile}
                  onClear={() => clearFile(setIdFile, idInputRef)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Proof of registration (PDF, JPG, PNG, WEBP, max 5 MB) *</Label>
                <Input
                  ref={proofInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  required
                  onChange={(e) => setProofOfRegFile(e.target.files?.[0] ?? null)}
                  className="h-10 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-primary"
                />
                <SelectedFileBadge
                  file={proofOfRegFile}
                  onClear={() => clearFile(setProofOfRegFile, proofInputRef)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Proof of residence acceptance (PDF, JPG, PNG, WEBP, max 5 MB)*</Label>
                <Input
                  ref={residenceInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  required
                  onChange={(e) => setResidenceProofFile(e.target.files?.[0] ?? null)}
                  className="h-10 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-primary"
                />
                <SelectedFileBadge
                  file={residenceProofFile}
                  onClear={() => clearFile(setResidenceProofFile, residenceInputRef)}
                />
              </div>

              {isNsfasRequired && (
                <div className="space-y-1">
                  <Label className="text-xs">
                    Proof of NSFAS funding (PDF, JPG, PNG, WEBP, max 5 MB) *
                  </Label>
                  <Input
                    ref={nsfasInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    required
                    onChange={(e) => setNsfasProofFile(e.target.files?.[0] ?? null)}
                    className="h-10 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-primary"
                  />
                  <SelectedFileBadge
                    file={nsfasProofFile}
                    onClear={() => clearFile(setNsfasProofFile, nsfasInputRef)}
                  />
                </div>
              )}

              {isBursaryRequired && (
                <div className="space-y-1">
                  <Label className="text-xs">
                    Proof of bursary acceptance (PDF, JPG, PNG, WEBP, max 5 MB) *
                  </Label>
                  <Input
                    ref={bursaryInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    required
                    onChange={(e) => setBursaryProofFile(e.target.files?.[0] ?? null)}
                    className="h-10 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-primary"
                  />
                  <SelectedFileBadge
                    file={bursaryProofFile}
                    onClear={() => clearFile(setBursaryProofFile, bursaryInputRef)}
                  />
                </div>
              )}

              {isPaymentProofRequired && (
                <div className="space-y-1">
                  <Label className="text-xs">
                    Proof of payment (PDF, JPG, PNG, WEBP, max 5 MB) *
                  </Label>
                  <Input
                    ref={paymentInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    required
                    onChange={(e) => setPaymentProofFile(e.target.files?.[0] ?? null)}
                    className="h-10 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-primary"
                  />
                  <SelectedFileBadge
                    file={paymentProofFile}
                    onClear={() => clearFile(setPaymentProofFile, paymentInputRef)}
                  />
                </div>
              )}

              <label className="flex items-start gap-2 pt-1 text-xs leading-relaxed">
                <input
                  type="checkbox"
                  checked={declarationAccepted}
                  onChange={(e) => setDeclarationAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-input"
                />
                <span>
                  I declare that the information provided in this transport application and any
                  supporting documents uploaded are true and correct. *
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Signature (full name) *</Label>
                  <Input
                    required
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="Type full name"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Signature date *</Label>
                  <Input
                    type="date"
                    required
                    value={signatureDate}
                    onChange={(e) => setSignatureDate(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {showForm && application && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1"
                  disabled={submitting}
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                className="h-11 flex-1"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Bus className="mr-2 h-4 w-4" />
                    Submit application
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}