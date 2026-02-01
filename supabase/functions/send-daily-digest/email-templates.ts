// supabase/functions/send-daily-digest/email-templates.ts

import { generateUnsubscribeToken } from './unsubscribe.ts'

interface Notification {
  id: string
  notification_type: string
  submission_type: string
  cafe_name: Record<string, string>
  cafe_slug: string | null
  rejection_reason: string | null
}

interface Translation {
  subject: string
  greeting: string
  approved_section: string
  rejected_section: string
  cafe_approved: (name: string, link: string) => string
  cafe_rejected: (name: string, reason: string) => string
  photo_approved: (cafeName: string) => string
  photo_rejected: (cafeName: string, reason: string) => string
  unsubscribe: string
  settings: string
}

const translations: Record<string, Translation> = {
  en: {
    subject: 'Your Cafes Seoul Update',
    greeting: 'Hey there!',
    approved_section: 'Approved',
    rejected_section: 'Declined',
    cafe_approved: (name: string, link: string) =>
      `Great news! Your cafe submission "${name}" was approved! <a href="${link}" style="color: #059669; text-decoration: none;">Check it out</a>`,
    cafe_rejected: (name: string, reason: string) =>
      `Your cafe submission "${name}" was declined. Reason: ${reason}`,
    photo_approved: (cafeName: string) =>
      `Your photo for "${cafeName}" was approved and is now visible!`,
    photo_rejected: (cafeName: string, reason: string) =>
      `Your photo for "${cafeName}" was declined. Reason: ${reason}`,
    unsubscribe: 'Unsubscribe from these emails',
    settings: 'Manage notification preferences'
  },
  ko: {
    subject: '카페 서울 업데이트',
    greeting: '안녕하세요!',
    approved_section: '승인됨',
    rejected_section: '거절됨',
    cafe_approved: (name: string, link: string) =>
      `좋은 소식이에요! "${name}" 카페 제출이 승인되었습니다! <a href="${link}" style="color: #059669; text-decoration: none;">확인하기</a>`,
    cafe_rejected: (name: string, reason: string) =>
      `"${name}" 카페 제출이 거절되었습니다. 사유: ${reason}`,
    photo_approved: (cafeName: string) =>
      `"${cafeName}"의 사진이 승인되어 공개되었습니다!`,
    photo_rejected: (cafeName: string, reason: string) =>
      `"${cafeName}"의 사진이 거절되었습니다. 사유: ${reason}`,
    unsubscribe: '이메일 수신 거부',
    settings: '알림 설정 관리'
  },
  fr: {
    subject: 'Votre mise à jour Cafes Seoul',
    greeting: 'Bonjour !',
    approved_section: 'Approuvé',
    rejected_section: 'Refusé',
    cafe_approved: (name: string, link: string) =>
      `Bonne nouvelle ! Votre café "${name}" a été approuvé ! <a href="${link}" style="color: #059669; text-decoration: none;">Voir le café</a>`,
    cafe_rejected: (name: string, reason: string) =>
      `Votre café "${name}" a été refusé. Raison : ${reason}`,
    photo_approved: (cafeName: string) =>
      `Votre photo pour "${cafeName}" a été approuvée et est maintenant visible !`,
    photo_rejected: (cafeName: string, reason: string) =>
      `Votre photo pour "${cafeName}" a été refusée. Raison : ${reason}`,
    unsubscribe: 'Se désabonner de ces emails',
    settings: 'Gérer les préférences de notification'
  },
  zh: {
    subject: '首尔咖啡馆更新',
    greeting: '你好！',
    approved_section: '已批准',
    rejected_section: '已拒绝',
    cafe_approved: (name: string, link: string) =>
      `好消息！您提交的咖啡馆"${name}"已获批准！<a href="${link}" style="color: #059669; text-decoration: none;">查看详情</a>`,
    cafe_rejected: (name: string, reason: string) =>
      `您提交的咖啡馆"${name}"已被拒绝。原因：${reason}`,
    photo_approved: (cafeName: string) =>
      `您为"${cafeName}"上传的照片已获批准并已公开！`,
    photo_rejected: (cafeName: string, reason: string) =>
      `您为"${cafeName}"上传的照片已被拒绝。原因：${reason}`,
    unsubscribe: '取消订阅这些邮件',
    settings: '管理通知偏好'
  },
  vi: {
    subject: 'Cập nhật Cafes Seoul của bạn',
    greeting: 'Xin chào!',
    approved_section: 'Đã phê duyệt',
    rejected_section: 'Đã từ chối',
    cafe_approved: (name: string, link: string) =>
      `Tin tốt! Quán cà phê "${name}" của bạn đã được phê duyệt! <a href="${link}" style="color: #059669; text-decoration: none;">Xem ngay</a>`,
    cafe_rejected: (name: string, reason: string) =>
      `Quán cà phê "${name}" của bạn đã bị từ chối. Lý do: ${reason}`,
    photo_approved: (cafeName: string) =>
      `Ảnh của bạn cho "${cafeName}" đã được phê duyệt và hiện đã hiển thị!`,
    photo_rejected: (cafeName: string, reason: string) =>
      `Ảnh của bạn cho "${cafeName}" đã bị từ chối. Lý do: ${reason}`,
    unsubscribe: 'Hủy đăng ký nhận email này',
    settings: 'Quản lý tùy chọn thông báo'
  }
}

function getCafeName(cafe_name: Record<string, string> | null, language: string): string {
  if (!cafe_name) return 'Unknown'
  return cafe_name[language] || cafe_name['en'] || cafe_name['ko'] || Object.values(cafe_name)[0] || 'Unknown'
}

function formatNotification(n: Notification, t: Translation, baseUrl: string, language: string): string {
  const cafeName = getCafeName(n.cafe_name, language)

  switch (n.notification_type) {
    case 'cafe_approved':
      const cafeLink = `${baseUrl}/cafe/${n.cafe_slug}`
      return t.cafe_approved(cafeName, cafeLink)
    case 'cafe_rejected':
      return t.cafe_rejected(cafeName, n.rejection_reason || 'No reason provided')
    case 'photo_approved':
      return t.photo_approved(cafeName)
    case 'photo_rejected':
      return t.photo_rejected(cafeName, n.rejection_reason || 'No reason provided')
    default:
      return ''
  }
}

function formatNotificationText(n: Notification, t: Translation, baseUrl: string, language: string): string {
  const cafeName = getCafeName(n.cafe_name, language)

  switch (n.notification_type) {
    case 'cafe_approved':
      const cafeLink = `${baseUrl}/cafe/${n.cafe_slug}`
      return `${cafeName} - ${cafeLink}`
    case 'cafe_rejected':
      return `${cafeName} - ${n.rejection_reason || 'No reason provided'}`
    case 'photo_approved':
      return cafeName
    case 'photo_rejected':
      return `${cafeName} - ${n.rejection_reason || 'No reason provided'}`
    default:
      return ''
  }
}

export async function generateDigestEmail(
  notifications: Notification[],
  language: string,
  userId: string,
  baseUrl: string
): Promise<{ html: string; text: string; subject: string }> {
  const t = translations[language as keyof typeof translations] || translations.en

  const approved = notifications.filter(n => n.notification_type.includes('approved'))
  const rejected = notifications.filter(n => n.notification_type.includes('rejected'))

  const unsubscribeToken = await generateUnsubscribeToken(userId)
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${unsubscribeToken}`
  const settingsUrl = `${baseUrl}/profile/settings?tab=notifications`

  // HTML template (table-based for email client compatibility)
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="padding: 24px; background-color: #1f2937; text-align: center;">
              <div style="color: #ffffff; font-size: 24px; font-weight: bold;">Cafes Seoul</div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <h1 style="color: #1f2937; font-size: 24px; margin: 0 0 16px; font-weight: 600;">${t.greeting}</h1>

              ${approved.length > 0 ? `
              <h2 style="color: #059669; font-size: 18px; margin: 24px 0 12px; font-weight: 600;">
                ${t.approved_section} (${approved.length})
              </h2>
              <ul style="padding-left: 20px; color: #374151; margin: 12px 0;">
                ${approved.map(n => `<li style="margin-bottom: 8px; line-height: 1.5;">${formatNotification(n, t, baseUrl, language)}</li>`).join('')}
              </ul>
              ` : ''}

              ${rejected.length > 0 ? `
              <h2 style="color: #dc2626; font-size: 18px; margin: 24px 0 12px; font-weight: 600;">
                ${t.rejected_section} (${rejected.length})
              </h2>
              <ul style="padding-left: 20px; color: #374151; margin: 12px 0;">
                ${rejected.map(n => `<li style="margin-bottom: 8px; line-height: 1.5;">${formatNotification(n, t, baseUrl, language)}</li>`).join('')}
              </ul>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #6b7280;">
              <p style="margin: 0 0 8px;">
                <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">${t.unsubscribe}</a>
                &nbsp;|&nbsp;
                <a href="${settingsUrl}" style="color: #6b7280; text-decoration: underline;">${t.settings}</a>
              </p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Cafes Seoul</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  // Plain text fallback
  const text = `${t.greeting}

${approved.length > 0 ? `${t.approved_section} (${approved.length}):
${approved.map(n => `- ${formatNotificationText(n, t, baseUrl, language)}`).join('\n')}

` : ''}${rejected.length > 0 ? `${t.rejected_section} (${rejected.length}):
${rejected.map(n => `- ${formatNotificationText(n, t, baseUrl, language)}`).join('\n')}

` : ''}---
${t.unsubscribe}: ${unsubscribeUrl}
${t.settings}: ${settingsUrl}

© ${new Date().getFullYear()} Cafes Seoul`

  return { html, text, subject: t.subject }
}
