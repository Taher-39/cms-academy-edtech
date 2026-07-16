const CONTACT = {
  phone: "+৮৮০ ১৫১৬-৫৫৯৫১৫",
  phoneHref: "tel:+8801516559515",
  whatsappHref: "https://wa.me/8801516559515",
  email: "comathacademy25@gmail.com",
  facebookLabel: "facebook.com/@cms-academy",
  facebookHref: "https://facebook.com/@cms-academy",
};

/** Wraps body HTML in a branded, table-based layout safe for common email clients. */
export function renderEmailTemplate(heading: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>CMS Academy</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family: 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#0F5D5A; padding:22px 32px;">
              <span style="color:#ffffff; font-size:20px; font-weight:700; letter-spacing:0.3px;">CMS Academy</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px; font-size:18px; color:#0F5D5A;">${heading}</h1>
              <div style="font-size:14px; line-height:1.7; color:#3f3f46;">
                ${bodyHtml}
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#fafafa; padding:20px 32px; border-top:1px solid #e4e4e7;">
              <p style="margin:0 0 8px; font-size:12px; color:#71717a;">যেকোনো প্রশ্নে যোগাযোগ করুন:</p>
              <p style="margin:0 0 6px; font-size:13px; color:#3f3f46;">
                📞 <a href="${CONTACT.phoneHref}" style="color:#0F5D5A; text-decoration:none;">${CONTACT.phone}</a>
                &nbsp;|&nbsp;
                💬 <a href="${CONTACT.whatsappHref}" style="color:#0F5D5A; text-decoration:none;">WhatsApp</a>
              </p>
              <p style="margin:0 0 6px; font-size:13px; color:#3f3f46;">
                ✉️ <a href="mailto:${CONTACT.email}" style="color:#0F5D5A; text-decoration:none;">${CONTACT.email}</a>
              </p>
              <p style="margin:0; font-size:13px;">
                📘 <a href="${CONTACT.facebookHref}" style="color:#D97757; text-decoration:none; font-weight:600;">${CONTACT.facebookLabel}</a>
              </p>
              <p style="margin:16px 0 0; font-size:11px; color:#a1a1aa;">© ${new Date().getFullYear()} CMS Academy. সর্বস্বত্ব সংরক্ষিত।</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
