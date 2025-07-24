import type { MessageTemplate } from "../types/contact"

export const APP_CONSTANTS = {
  // Application settings
  APP_NAME: "Saudiease WhatsApp Link",
  APP_DESCRIPTION:
    "Generate WhatsApp links quickly and easily with our simple tool. Perfect for businesses and personal use.",

  // File upload settings
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  UPLOAD_PASSWORD: "Pass123123",
  SUPPORTED_FILE_TYPES: [".xlsx", ".xls", ".csv"],

  // Batch sending settings
  BATCH_SEND_DELAY_MS: 500, // Delay between opening WhatsApp tabs

  // Pagination settings
  DEFAULT_ITEMS_PER_PAGE: 12,
  ITEMS_PER_PAGE_OPTIONS: [6, 12, 24, 48],

  // Contact status options
  CONTACT_STATUSES: ["pending", "sent", "not_sent"] as const,

  // Filter options
  WEBSITE_FILTER_OPTIONS: ["all", "with_website", "no_website"] as const,
  STATUS_FILTER_OPTIONS: ["all", "pending", "sent", "not_sent"] as const,
} as const

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "welcome_with_website",
    name: "Welcome - With Website",
    category: "Welcome",
    content: `Hello *{companyName}*! 👋

I noticed your company in the _{companyCategory}_ industry. I visited your website at {website} and I'm impressed!

We specialize in helping businesses like yours grow. Would you be interested in a quick chat about how we can support your business goals?`,
    variables: ["{companyName}", "{companyCategory}", "{website}"],
    targetAudience: "with_website",
  },
  {
    id: "welcome_no_website",
    name: "Welcome - No Website",
    category: "Welcome",
    content: `Hello *{companyName}*! 👋

I see you're in the _{companyCategory}_ industry. In today's digital world, having an online presence is crucial for business growth.

We help businesses like yours establish a strong digital presence. Would you like to discuss how we can help you get online and reach more customers?`,
    variables: ["{companyName}", "{companyCategory}"],
    targetAudience: "no_website",
  },
  {
    id: "follow_up_general",
    name: "Follow Up - General",
    category: "Follow Up",
    content: `Hi *{companyName}*! 👋

I hope you're doing well. I wanted to follow up on our previous conversation about growing your _{companyCategory}_ business.

Do you have a few minutes to discuss how we can help you achieve your business goals?`,
    variables: ["{companyName}", "{companyCategory}"],
    targetAudience: "all",
  },
  {
    id: "service_offer",
    name: "Service Offer",
    category: "Sales",
    content: `Hello *{companyName}*! 🚀

As a _{companyCategory}_ business, you understand the importance of staying competitive. We're offering a *special package* designed specifically for companies in your industry.

✅ Increase your online visibility
✅ Generate more leads
✅ Boost your revenue

Interested in learning more? Let's schedule a quick 15-minute call!`,
    variables: ["{companyName}", "{companyCategory}"],
    targetAudience: "all",
  },
  {
    id: "custom_variable_example",
    name: "Custom Variable Example",
    category: "Custom",
    content: `Hi {contactPerson}! This is a message about your interest in {product}. Your last interaction was on {lastInteractionDate}. Let's connect!`,
    variables: ["{contactPerson}", "{product}", "{lastInteractionDate}"],
    targetAudience: "all",
  },
]
