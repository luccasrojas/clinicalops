export const paths = {
  home: {
    getHref: () => '/',
  },
  auth: {
    login: {
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
    signup: {
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/signup${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
  },
  sections: {
    benefits: '#beneficios',
    howItWorks: '#funcionamiento',
    testimonials: '#testimonios',
  },
} as const
