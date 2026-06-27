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

export interface ProfileData {
  logoUrl: string;
  title: string;
  description: string;
  loginButtonText: string;
  loginButtonUrl: string;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  line: string;
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
