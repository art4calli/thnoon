/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SheetRow {
  type: string;        // 'بطاقة' | 'معرض صور' | 'من نحن'
  title: string;
  description: string;
  media: {
    url: string;
    pairUrl?: string; // YouTube video URL paired with image, or vice versa
  }[];
  linkUrl?: string;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
}

export interface ProfileData {
  logoUrl: string;
  title: string;
  description: string;
  loginButtonText: string;
  loginButtonUrl: string;
  headerBgUrl?: string;
  features?: FeatureItem[];
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  line: string;
}

export interface ContactCardItem {
  title: string;
  value: string;
  icon: string;
}

export interface ContactDetails {
  badge?: string;
  title?: string;
  description?: string;
  panelTitle?: string;
  panelDescription?: string;
  cards: ContactCardItem[];
}

export interface AppData {
  profile: ProfileData;
  socialLinks: SocialLinks;
  homeCards: SheetRow[];
  artworkCards: SheetRow[];
  videoCards: SheetRow[];
  coursesCards: SheetRow[];
  toolsCards: SheetRow[];
  aboutCards: SheetRow[];
  contactCards: SheetRow[];
  contactInfo?: ContactDetails;
}

export interface SubscriberState {
  isLoggedIn: boolean;
  subscriberName?: string;
  links: {
    text: string;
    comment: string;
    url: string;
  }[];
  exitButtonText?: string;
  exitButtonComment?: string;
}
