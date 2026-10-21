"use client";

import {
  BadgeCheck,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Globe2,
  Landmark,
  Link2,
  LockKeyhole,
  Paperclip,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { prepareCopyTone } from "./copy-sound";
import { accountUrl, readAccountPreference, saveAccountPreference } from "./browser-safety";

type Bank = {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  logoScale?: string;
  accent: string;
  accentSoft: string;
  highlight: string;
};

type Account = {
  id: string;
  bankId: string;
  label: string;
  branch?: string;
  account: string;
  iban: string;
  owner: string;
};

const banks: Bank[] = [
  {
    id: "jumhouria",
    name: "مصرف الجمهورية",
    shortName: "الجمهورية",
    logo: "/banks/jumhouria-mark.png",
    logoScale: "62%",
    accent: "#0872be",
    accentSoft: "#eaf5fc",
    highlight: "#0fa4d8",
  },
  {
    id: "north-africa",
    name: "مصرف شمال أفريقيا",
    shortName: "شمال أفريقيا",
    logo: "/banks/north-africa-mark.png",
    logoScale: "72%",
    accent: "#153da6",
    accentSoft: "#eef1fb",
    highlight: "#f0a33b",
  },
  {
    id: "nuran",
    name: "مصرف النوران",
    shortName: "النوران",
    logo: "/banks/nuran-mark.jpg",
    logoScale: "76%",
    accent: "#2f8fba",
    accentSoft: "#eaf7fb",
    highlight: "#84cbd8",
  },
  {
    id: "andalus",
    name: "مصرف الأندلس",
    shortName: "الأندلس",
    logo: "/banks/andalus-mark.png",
    logoScale: "74%",
    accent: "#34599a",
    accentSoft: "#f0f3fa",
    highlight: "#d7b969",
  },
  {
    id: "yaqeen",
    name: "مصرف اليقين",
    shortName: "اليقين",
    logo: "/banks/yaqeen-mark.svg",
    logoScale: "69%",
    accent: "#0b1338",
    accentSoft: "#eef0f6",
    highlight: "#f47d3f",
  },
];

const accounts: Account[] = [
  {
    id: "jumhouria",
    bankId: "jumhouria",
    label: "حساب الشركة",
    branch: "فرع الدعوة الإسلامية – طرابلس",
    account: "112207000003204",
    iban: "LY92002112112207000003204",
    owner: "شركة زهرة كادي للصناعات الغذائية",
  },
  {
    id: "north-africa",
    bankId: "north-africa",
    label: "زهرة كادي",
    account: "036011369906015",
    iban: "LY57007036036011369906015",
    owner: "زهرة كادي لبيع الحلويات",
  },
  {
    id: "nuran",
    bankId: "nuran",
    label: "حساب الشركة",
    account: "100232210200197",
    iban: "LY58024005010023221020501",
    owner: "شركة زهرة كادي للصناعات الغذائية",
  },
  {
    id: "andalus-sales",
    bankId: "andalus",
    label: "زهرة كادي",
    account: "202902559101017",
    iban: "LY93027101202902559101017",
    owner: "زهرة كادي لبيع الحلويات",
  },
  {
    id: "andalus-company",
    bankId: "andalus",
    label: "حساب الشركة",
    account: "202905352001014",
    iban: "LY05027202202905352001014",
    owner: "شركة زهرة كادي للصناعات الغذائية",
  },
  {
    id: "yaqeen",
    bankId: "yaqeen",
    label: "حساب الشركة",
    account: "203000053130016",
    iban: "LY56026203203000053130016",
    owner: "شركة زهرة كادي للصناعات الغذائية",
  },
];

const formatNumber = (value: string) => value.match(/.{1,4}/g)?.join(" ") ?? value;
const receiptWhatsAppNumber = "218911469000";

export default function Home() {
  const [selectedId, setSelectedId] = useState(accounts[0].id);
  const [copied, setCopied] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [showMobileAction, setShowMobileAction] = useState(false);
  const copyStationHeadingRef = useRef<HTMLDivElement>(null);

  const selected = accounts.find((account) => account.id === selectedId) ?? accounts[0];
  const selectedBank = banks.find((bank) => bank.id === selected.bankId) ?? banks[0];
  const bankAccounts = accounts.filter((account) => account.bankId === selectedBank.id);
  const receiptMessage = [
    "السلام عليكم، أود إرسال إيصال تحويل إلى حساب كادي.",
    `المصرف: ${selectedBank.name}`,
    `الحساب: ${selected.label}`,
    `رقم الحساب: ${selected.account}`,
  ].join("\n");
  const receiptWhatsAppUrl = `https://wa.me/${receiptWhatsAppNumber}?text=${encodeURIComponent(receiptMessage)}`;

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("bank");
    const stored = readAccountPreference();
    const initial =
      accounts.find((item) => item.id === requested)?.id ??
      accounts.find((item) => item.id === stored)?.id ??
      accounts[0].id;

    const frame = window.requestAnimationFrame(() => {
      setSelectedId(initial);
      setHydrated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveAccountPreference(selectedId);
    try {
      window.history.replaceState({}, "", accountUrl(window.location.href, selectedId));
    } catch {
      // A browser restriction on history must not disable viewing or copying.
    }
  }, [hydrated, selectedId]);

  useEffect(() => {
    const heading = copyStationHeadingRef.current;
    if (!heading) return;

    // Reveal as step 2 enters above the dock, and hide when scrolling back before it.
    const observer = new IntersectionObserver(([entry]) => {
      setShowMobileAction(entry.boundingClientRect.top <= (entry.rootBounds?.bottom ?? window.innerHeight - 96));
    }, { threshold: 0, rootMargin: "0px 0px -96px 0px" });
    observer.observe(heading);
    return () => observer.disconnect();
  }, [selectedId]);

  const selectAccount = (id: string) => {
    if (id === selectedId) return;
    setCopied(null);
    setNotice("");
    setSelectedId(id);
  };

  const selectBank = (bankId: string) => {
    const firstAccount = accounts.find((account) => account.bankId === bankId);
    if (firstAccount) selectAccount(firstAccount.id);
  };

  const writeClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      try {
        return document.execCommand("copy");
      } catch {
        return false;
      } finally {
        field.remove();
      }
    }
  };

  const copyValue = async (value: string, key: string, label: string) => {
    if (!hydrated) return;
    const playCopyTone = prepareCopyTone();
    const copiedSuccessfully = await writeClipboard(value);
    if (!copiedSuccessfully) {
      setNotice("تعذّر النسخ. اضغط مطولًا على الرقم لنسخه يدويًا");
      window.setTimeout(() => setNotice(""), 3200);
      return;
    }

    setCopied(key);
    setNotice(`تم نسخ ${label}`);
    playCopyTone();
    if (navigator.vibrate) navigator.vibrate(25);
    window.setTimeout(() => setCopied(null), 1700);
    window.setTimeout(() => setNotice(""), 2400);
  };

  const copyAll = async () => {
    const text = [
      "بيانات حساب كادي الرسمي",
      selectedBank.name,
      selected.branch,
      `اسم المستفيد: ${selected.owner}`,
      `رقم الحساب: ${selected.account}`,
      `IBAN: ${selected.iban}`,
    ]
      .filter(Boolean)
      .join("\n");
    await copyValue(text, "all", "كل البيانات");
  };

  const shareAccount = async () => {
    if (!hydrated) return;
    const url = accountUrl(window.location.href, selected.id, true);
    const text = `${selectedBank.name}\n${selected.owner}\nرقم الحساب: ${selected.account}\nIBAN: ${selected.iban}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `حساب كادي — ${selectedBank.name}`,
          text,
          url: url.toString(),
        });
      } else {
        await copyValue(`${text}\n${url}`, "share", "رابط الحساب");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setNotice("تعذّرت المشاركة، جرّب نسخ كل البيانات");
      }
    }
  };

  return (
    <main className="app-shell">
      <a className="skip-link" href="#accounts">
        انتقل إلى الحسابات
      </a>

      <header className="site-header">
        <a className="cady-brand" href="#top" aria-label="Cady Pay — الرئيسية">
          <span className="cady-logo">
            <img src="/cady-logo.png" alt="" />
          </span>
          <span className="brand-copy">
            <strong>Cady Pay</strong>
            <small>حسابات كادي الرسمية</small>
          </span>
        </a>

        <div className="header-status" aria-label="مصدر الدليل: كادي">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>دليل رسمي من كادي</span>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <span className="eyebrow">
            <BadgeCheck size={17} /> مسار كادي للحساب الصحيح
          </span>
          <h1>
            <span>كل حسابات كادي</span>
            <strong>في مكان واحد</strong>
          </h1>
          <p>
            محفظة بصرية تجمع حسابات كادي الرسمية؛ غيّر المصرف فتصل بطاقة الحساب الصحيحة
            جاهزة للنسخ.
          </p>
          <div className="hero-proof">
            <span>
              <Landmark size={16} /> 5 مصارف
            </span>
            <span>
              <LockKeyhole size={16} /> لا نطلب بياناتك
            </span>
          </div>
        </div>

        <ol className="journey" aria-label="طريقة استخدام الموقع">
          <li>
            <span>1</span>
            <div>
              <strong>اختر المصرف</strong>
              <small>من القائمة الرسمية</small>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>راجع المستفيد</strong>
              <small>قبل فتح تطبيق المصرف</small>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>انسخ وحوّل</strong>
              <small>التحويل يتم في تطبيقك</small>
            </div>
          </li>
        </ol>
      </section>

      <section className="account-workspace" id="accounts" aria-label="حسابات كادي المصرفية">
        <aside className="bank-nav">
          <div className="section-heading">
            <div>
              <span>الخطوة 1</span>
              <h2>اختر المصرف</h2>
            </div>
            <small>5 مصارف · 6 حسابات</small>
          </div>

          <div className="bank-list">
            {banks.map((bank) => {
              const active = bank.id === selectedBank.id;
              const count = accounts.filter((account) => account.bankId === bank.id).length;
              return (
                <button
                  key={bank.id}
                  className={active ? "bank-option active" : "bank-option"}
                  type="button"
                  onClick={() => selectBank(bank.id)}
                  aria-pressed={active}
                  aria-label={`اختيار ${bank.name}`}
                  style={
                    {
                      "--logo-scale": bank.logoScale ?? "72%",
                      "--bank-accent": bank.accent,
                      "--bank-soft": bank.accentSoft,
                      "--bank-highlight": bank.highlight,
                    } as CSSProperties
                  }
                >
                  <span className="bank-logo">
                    <img src={bank.logo} alt={`شعار ${bank.name}`} />
                  </span>
                  <span className="bank-name">
                    <strong>{bank.shortName}</strong>
                    <small>{count > 1 ? "حسابان متاحان" : "حساب واحد"}</small>
                  </span>
                  <span className="option-check" aria-hidden="true">
                    <Check size={15} strokeWidth={3} />
                  </span>
                </button>
              );
            })}
          </div>

          <p className="device-note">
            <LockKeyhole size={15} /> نحفظ آخر اختيار على جهازك فقط لفتح الحساب أسرع في المرة القادمة.
          </p>
        </aside>

        <article
          key={selected.id}
          className="account-panel"
          id="account"
          aria-live="polite"
          style={
            {
              "--bank-accent": selectedBank.accent,
              "--bank-soft": selectedBank.accentSoft,
              "--bank-highlight": selectedBank.highlight,
            } as CSSProperties
          }
        >
          <div className="account-topline">
            <span className="official-chip">
              <ShieldCheck size={16} /> حساب رسمي
            </span>
            <span className="account-label">{selected.label}</span>
          </div>

          <div className="account-identity">
            <span className="bank-emblem">
              <span className="emblem-orbit" aria-hidden="true" />
              <span
                className="summary-logo"
                style={{ "--logo-scale": selectedBank.logoScale ?? "72%" } as CSSProperties}
              >
                <img src={selectedBank.logo} alt={`شعار ${selectedBank.name}`} />
              </span>
              <i className="emblem-particle particle-one" aria-hidden="true" />
              <i className="emblem-particle particle-two" aria-hidden="true" />
              <i className="emblem-particle particle-three" aria-hidden="true" />
            </span>
            <div>
              <small className="identity-kicker">
                هوية الحساب
              </small>
              <h2>{selectedBank.name}</h2>
              {selected.branch && <p>{selected.branch}</p>}
              <span className="account-ready">
                <BadgeCheck size={14} /> البيانات جاهزة للنسخ
              </span>
            </div>
          </div>

          {bankAccounts.length > 1 && (
            <div className="account-switcher" role="group" aria-label="اختر حساب الأندلس">
              {bankAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  className={account.id === selected.id ? "active" : ""}
                  onClick={() => selectAccount(account.id)}
                  aria-pressed={account.id === selected.id}
                >
                  {account.label}
                </button>
              ))}
            </div>
          )}

          <div className="beneficiary-card">
            <span>اسم المستفيد الذي يجب أن يظهر في تطبيق المصرف</span>
            <strong>{selected.owner}</strong>
            <small>
              <BadgeCheck size={15} /> طابق الاسم قبل تأكيد التحويل
            </small>
          </div>

          <section className="copy-station" aria-labelledby="copy-station-title">
            <div ref={copyStationHeadingRef} className="copy-station-head">
              <span className="station-step" aria-hidden="true">2</span>
              <div>
                <h3 id="copy-station-title">انسخ بيانات التحويل</h3>
                <p>اختر الرقم الذي يطلبه تطبيق مصرفك.</p>
              </div>
            </div>

            <div className="number-stack">
              <button
                className={copied === "account" ? "number-row account-card copied" : "number-row account-card"}
                type="button"
                onClick={() => copyValue(selected.account, "account", "رقم الحساب")}
                aria-label={`نسخ رقم الحساب ${selected.account}`}
              >
                <span className="data-kind">
                  <span><CreditCard size={18} aria-hidden="true" /> رقم الحساب</span>
                  <em>ACCOUNT NUMBER</em>
                </span>
                <b className="transfer-number" dir="ltr">{formatNumber(selected.account)}</b>
                <span className="number-row-bottom">
                  <span className="copy-hint">{selectedBank.name}</span>
                  <span className="copy-icon" aria-hidden="true">
                    {copied === "account" ? <Check size={17} /> : <Copy size={17} />}
                    {copied === "account" ? "تم النسخ" : "نسخ رقم الحساب"}
                  </span>
                </span>
              </button>

              <button
                className={copied === "iban" ? "number-row iban-card copied" : "number-row iban-card"}
                type="button"
                onClick={() => copyValue(selected.iban, "iban", "رقم IBAN")}
                aria-label={`نسخ رقم IBAN ${selected.iban}`}
              >
                <span className="data-kind">
                  <span><Globe2 size={18} aria-hidden="true" /> رقم IBAN</span>
                  <em>الحساب الدولي</em>
                </span>
                <b className="transfer-number" dir="ltr">{formatNumber(selected.iban)}</b>
                <span className="number-row-bottom">
                  <span className="copy-icon" aria-hidden="true">
                    {copied === "iban" ? <Check size={17} /> : <Copy size={17} />}
                    {copied === "iban" ? "تم النسخ" : "نسخ IBAN"}
                  </span>
                </span>
              </button>
            </div>

            <p className="station-note"><Check size={14} aria-hidden="true" /> تُنسخ الأرقام بدون مسافات، وجاهزة للصق في تطبيق المصرف.</p>

            <div className="account-actions">
              <button
                className={copied === "all" ? "copy-all copied" : "copy-all"}
                type="button"
                onClick={copyAll}
              >
                {copied === "all" ? <Check size={18} /> : <Copy size={18} />}
                {copied === "all" ? "تم نسخ كل البيانات" : "نسخ كل البيانات"}
              </button>
              <button className="share-account" type="button" onClick={shareAccount}>
                <Share2 size={18} /> مشاركة الحساب
              </button>
            </div>
          </section>

          <div className="safety-callout">
            <ShieldCheck size={21} />
            <div>
              <strong>تنبيه قبل التحويل</strong>
              <p>لا تؤكد العملية إن لم يتطابق اسم المستفيد مع الاسم الظاهر أعلاه.</p>
            </div>
          </div>

          <section className="receipt-station" aria-labelledby="receipt-title">
            <div className="receipt-station-heading">
              <span className="receipt-step" aria-hidden="true">٣</span>
              <span>بعد إتمام التحويل</span>
            </div>
            <h3 id="receipt-title">أرسل إيصال التحويل</h3>
            <p className="receipt-description">أرسل الإيصال إلى فريق كادي عبر واتساب لمراجعة التحويل.</p>
            <div className="receipt-account">
              <Landmark size={24} strokeWidth={1.7} aria-hidden="true" />
              <div>
                <strong>{selectedBank.name}</strong>
                <span>{selected.label}</span>
              </div>
            </div>
            <a
              className="whatsapp-receipt"
              href={receiptWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-describedby="receipt-instructions"
            >
              <svg className="whatsapp-mark" viewBox="-1 -1 26 26" width="28" height="28" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M20.52 3.48A11.9 11.9 0 0 0 12.05 0C5.46 0 .1 5.36.1 11.95c0 2.1.55 4.16 1.6 5.98L0 24l6.22-1.63a11.94 11.94 0 0 0 5.82 1.49h.01c6.59 0 11.95-5.36 11.95-11.95 0-3.19-1.24-6.19-3.48-8.43ZM12.05 21.85a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.69.97.99-3.6-.24-.37a9.87 9.87 0 0 1-1.51-5.31c0-5.48 4.46-9.94 9.95-9.94a9.88 9.88 0 0 1 7.03 2.91 9.87 9.87 0 0 1 2.91 7.04c0 5.48-4.46 9.89-9.94 9.89Zm5.45-7.41c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.23-.65.08-.3-.15-1.26-.47-2.4-1.48-.89-.79-1.49-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.58c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.1 4.49.71.3 1.27.48 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35Z" />
              </svg>
              <span>إرسال الإيصال عبر واتساب</span>
            </a>
            <p id="receipt-instructions" className="receipt-instructions">
              <Paperclip size={19} strokeWidth={1.7} aria-hidden="true" />
              <span>بعد فتح المحادثة، أرفق صورة الإيصال ثم أرسل الرسالة.</span>
            </p>
          </section>
          <p className="receipt-contact">واتساب كادي <bdi dir="ltr">091 146 9000</bdi></p>
        </article>
      </section>

      <section className="trust-grid" aria-label="معلومات عن الخدمة">
        <article>
          <span>
            <LockKeyhole size={20} />
          </span>
          <div>
            <strong>لا نجمع أي بيانات مصرفية</strong>
            <p>هذا الدليل يعرض الأرقام ويسهّل نسخها فقط.</p>
          </div>
        </article>
        <article>
          <span>
            <Copy size={20} />
          </span>
          <div>
            <strong>نسخ دقيق بنقرة واحدة</strong>
            <p>تُنسخ الأرقام الأصلية من دون المسافات الظاهرة.</p>
          </div>
        </article>
        <article>
          <span>
            <Link2 size={20} />
          </span>
          <div>
            <strong>رابط مباشر لكل حساب</strong>
            <p>شارك الحساب المختار من دون إرباك الطرف الآخر.</p>
          </div>
        </article>
      </section>

      <footer className="footer">
        <div>
          <strong>Cady Pay</strong>
          <span>© 2026 شركة زهرة كادي للصناعات الغذائية</span>
        </div>
        <a href="https://www.facebook.com/Cady.sw/" target="_blank" rel="noreferrer">
          صفحة كادي الرسمية <ExternalLink size={14} />
        </a>
      </footer>

      <div className={notice ? "toast show" : "toast"} role="status" aria-live="polite">
        <span>
          <Check size={15} strokeWidth={3} />
        </span>
        {notice}
      </div>

      <div
        className={showMobileAction ? "mobile-action visible" : "mobile-action"}
        aria-label="إجراء سريع للحساب المختار"
        aria-hidden={!showMobileAction}
        inert={!showMobileAction}
      >
        <span>
          <small>{selectedBank.shortName}</small>
          <b dir="ltr">{formatNumber(selected.account)}</b>
        </span>
        <button
          className={copied === "account" ? "copied" : ""}
          type="button"
          onClick={() => copyValue(selected.account, "account", "رقم الحساب")}
        >
          {copied === "account" ? <Check size={18} /> : <Copy size={18} />}
          {copied === "account" ? "تم النسخ" : "نسخ الرقم"}
        </button>
      </div>

    </main>
  );
}
