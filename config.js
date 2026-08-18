/* ==========================================================================
   Aman - site content
   --------------------------------------------------------------------------
   This is the only file you need to edit to change the site.
   No build step, no tools. Edit, save, push.

   TO ADD A VIDEO: find the right group below and add one line:

       { src: "https://youtu.be/dQw4w9WgXcQ", title: "Client name" },

   The "src" accepts any of these, pasted straight from your browser:
       https://www.youtube.com/watch?v=VIDEO_ID
       https://youtu.be/VIDEO_ID
       https://www.youtube.com/shorts/VIDEO_ID
       VIDEO_ID
       assets/media/your-clip.mp4

   "title" is optional. Leave a group's list empty and that whole
   subsection disappears from the page until you add something to it.
   ========================================================================== */

window.SITE_CONFIG = {

  /* --- Basics ----------------------------------------------------------- */
  brand: {
    name: "Aman",
    firstName: "Aman",
    role: "Video Editor / AI Video Creator / Content Creator /  Motion Designer",
    calendly: "https://calendly.com/cutsbyaman/30min",
    // {year} is replaced with the current year, so this never goes stale.
    copyright: "© {year} Aman. All rights reserved.",
  },

  /* --- Links in copy ---------------------------------------------------- */
  // Any phrase listed here becomes a link wherever it shows up in bound copy,
  // so the credential only needs writing once.
  links: {
    "AEVY TV": "https://www.aevytv.com/",
  },

  /* --- Opening animation ------------------------------------------------ */
  // The black title card that draws the signature before the page appears.
  // Its wording and the signature artwork live in index.html.
  intro: {
    enabled: true,
    oncePerSession: false, // true = show it on the first visit of a session only
  },

  /* --- Hero ------------------------------------------------------------- */
  hero: {
    // Shown in the pill with the pulsing dot. Say when you're free to take work.
    availability: "Available for new projects",
    // Small credential tag on the portrait. Set to "" to hide it.
    badge: "Certified by AEVY TV",
    // The word in "accent" is set in the serif italic face.
    headline: "Turning Raw Footage Into Stories That",
    accent: "Hold Attention",
    // The \n breaks are kept as written: the hero paragraph is pre-line.
    intro:
      "Video Editor & AI Video Creator crafting content for creators and brands worldwide. AEVY TV certified.\n\n" +
      "Currently at Emergent, leading video across performance, influencer, and launch formats including a User Story featured in their Series C Unicorn announcement and the launch films for Vibecon, Bengaluru.\n\n" +
      "Past work: 300+ finance videos behind a 300K+ following, and YouTube edits with 10M+ views.\n\n" +
      "Let's make something. Give me a nudge.",
    portrait: "assets/media/aman-portrait.jpeg",
  },

  /* --- Tools marquee ---------------------------------------------------- */
  // "logo" points at a file in assets/logos. Brands with no published mark use
  // "short" instead, the two-letter badge tinted by "color". Drop a file in and
  // swap the line over to give one of those a real logo.
  tools: [
    { name: "Adobe Premiere Pro", logo: "assets/logos/premiere-pro.svg" },
    { name: "Adobe After Effects", logo: "assets/logos/after-effects.svg" },
    { name: "Adobe Photoshop", logo: "assets/logos/photoshop.svg" },
    { name: "Higgsfield", logo: "assets/logos/higgsfield.png" },
    { name: "Claude", logo: "assets/logos/claude.svg" },
    { name: "ChatGPT", logo: "assets/logos/chatgpt.svg" },
    { name: "Gemini", logo: "assets/logos/gemini.svg" },
    { name: "Veo 3", short: "V3", color: "#a78bfa" },
    { name: "Nano Banana", short: "Nb", color: "#ffd54f" },
    { name: "Adobe Creative Cloud", logo: "assets/logos/creative-cloud.svg" },
  ],

  /* --- Projects --------------------------------------------------------- */
  projects: {
    heading: "My Projects",
    accent: "Projects",
    intro:
      "Short form built to stop the scroll, long form built to keep people watching. " +
      "Here's a cut of both.",

    sections: [
      {
        label: "Short-form",
        ratio: "9 : 16",
        // Cards play muted on their own while on screen. Set false for
        // click-to-play thumbnails instead.
        autoplay: true,
        groups: [
          {
            label: "Brand Work",
            videos: [
              { src: "https://youtu.be/JQo2pmOMplI" },
              { src: "https://youtu.be/veP5zxaU89E" },
              { src: "https://youtu.be/Q4yIGQgA5wM" },
              { src: "https://youtu.be/DPDGpbLHiBY" },
              { src: "https://youtu.be/AMGBYReNFi4" },
              { src: "https://youtu.be/ipdkjYXXF0w" },
              { src: "https://youtu.be/ZyGXavVajns" },
            ],
          },
          {
            label: "Personal Content",
            videos: [
              { src: "https://youtu.be/Vv2gsD2jJWU" },
              { src: "https://youtu.be/9HfWGqNgCjw" },
              { src: "https://youtu.be/6abOyGbFNlQ" },
              { src: "https://youtu.be/K_AT8Q5TZ-M" },
              { src: "https://youtu.be/J7-P6Of2dGU" },
            ],
          },
          {
            label: "AI Work",
            videos: [
              // Add AI short-form here, e.g.
              { src: "https://youtu.be/Tbe-J7Lpu8s" },
              { src: "https://youtu.be/ImaE6RqOHys" },
              { src: "https://youtu.be/aMKoRvcrktY" },
              { src: "https://youtu.be/zQ5-ADZ-Ap4" },
              { src: "https://youtu.be/xH9R0NBmULw" },
            ],
          },
        ],
      },
      {
        label: "Long-form",
        ratio: "16 : 9",
        autoplay: true,
        groups: [
          {
            label: "Motion Design",
            videos: [
              { src: "https://youtu.be/c80kyDvAO8s" },
              { src: "https://youtu.be/NZ4SB32iNBs" },
              { src: "https://youtu.be/76VNysP-5OI" },
              { src: "https://youtu.be/1bL8K06FbnY" },
              { src: "https://youtu.be/Eml8DORc86Q" },
            ],
          },
          {
            label: "Brand Work",
            videos: [
              { src: "https://youtu.be/M9XdSTK4Obs" },
              { src: "https://youtu.be/16Qky3Yy6lo" },
              { src: "https://youtu.be/vlfIV_Z7DBE" },
              { src: "https://youtu.be/Q9oPCsbAS3U" },
              { src: "https://youtu.be/sit55JD62kM" },
              { src: "https://youtu.be/rycTVyDd7EY" },
              { src: "https://youtu.be/w-Xf70yXLUs" },
              { src: "https://youtu.be/g6oy-192XzM" },
              { src: "https://youtu.be/h_fypxpEoEM" },
              { src: "https://youtu.be/YNUnP4PoFfI" },
              { src: "https://youtu.be/fPrTS-BItHk" },
            ],
          },
          {
            label: "Production Video",
            videos: [
              { src: "https://youtu.be/KcmP16bv6Gw" },
              { src: "https://youtu.be/eoJBgd3HEFg" },
              { src: "https://youtu.be/VTMr1apHQZk" },
              { src: "https://youtu.be/7iz-1MdC52U" },
              { src: "https://youtu.be/u8gp4c0QXlg" },
            ],
          },
        ],
      },
    ],
  },

  /* --- Numbers ---------------------------------------------------------- */
  stats: [
    { value: "4.5", label: "Years Of Experience" },
    { value: "35+", label: "International Clients" },
    { value: "1500+", label: "Videos Edited" },
    { value: "100%", label: "Client Satisfaction" },
  ],

  /* --- Testimonials ----------------------------------------------------- */
  testimonials: {
    heading: "Look at what my clients have to say about working with me.",
    accent: "clients",
    people: [
      {
        name: "William Stewart",
        meta: "5k+ Followers",
        avatar: "assets/media/client-william.jpg",
        video: "assets/media/testimonial-william.mp4",
      },
      {
        name: "Archit Mehrotra",
        meta: "348k+ Followers",
        avatar: "assets/media/client-archit.jpg",
        video: "assets/media/testimonial-archit.mp4",
      },
      {
        name: "Jirie Caribbean",
        meta: "112k+ Subscribers",
        avatar: "assets/media/client-jirie.jpg",
        video: "assets/media/testimonial-jirie.mp4",
      },
    ],
  },

  /* --- Socials ---------------------------------------------------------- */
  socials: [
    { name: "Instagram", url: "https://www.instagram.com/aman.explained/", icon: "instagram" },
    { name: "X", url: "https://twitter.com/cutsbyaman", icon: "x" },
    { name: "LinkedIn", url: "https://www.linkedin.com/in/aman-raj-105b5922a/", icon: "linkedin" },
    { name: "WhatsApp", url: "https://wa.me/qr/ZOYFZXPEZ3OIJ1", icon: "whatsapp" },
  ],

  /* --- About page ------------------------------------------------------- */
  about: {
    heading: "About Me",
    intro:
      "Where I have worked, what I work on, and the kit I reach for. If it looks like a fit, " +
      "the calendar's open.",
    bio: [
      "Creative Video Editor crafting impactful content for brands and creators. Skilled in " +
      "shooting and editing AI ad videos, product demos, social media content, and podcasts, " +
      "blending storytelling, pacing, and color mastery to create visually compelling work. " +
      "Dedicated to delivering high-impact videos that elevate engagement and strengthen " +
      "brand presence.",
    ],

    languages: "English & Hindi",

    skills: [
      "Video Editing & Post-Production",
      "Motion Graphics & Text Animation",
      "AI Video Creation",
      "Product & Brand Video Production",
      "Social Media Content Strategy",
      "Meta Ad Campaign Planning",
    ],

    // Newest first. "points" renders as bullets, "description" as a paragraph,
    // and "url" turns the company name into a link.
    experience: [
      {
        date: "Jan 2026 - Present",
        role: "Video Editor / AI Video Creator",
        org: "Emergent",
        url: "https://www.linkedin.com/company/emergentlabs/",
        type: "Full-time",
        points: [
          "Own the full video pipeline, from ideation and shooting through editing and motion graphics, across Organic, Performance, Influencer, User Story, and Product Feature & Launch formats.",
          "Shipped 300+ videos, sustaining a pace of up to 3 Meta ad videos a day while turning around last-minute, high-stakes launch content on tight deadlines.",
          "Edited a User Story video featured in Emergent's Series C Unicorn announcement, one of the company's highest-visibility moments.",
          "Produced the launch video and event display film for Vibecon, Emergent's flagship event in Bengaluru.",
        ],
      },
      {
        date: "Apr 2024 - Dec 2025",
        role: "Video Editor",
        org: "Vyapar App",
        url: "https://www.linkedin.com/company/vyaparapp/",
        type: "Full-time",
        points: [
          "Shot and edited product demos, AI ad videos, social media content and podcasts to raise brand visibility.",
          "Led the end-to-end video pipeline: ideation, shooting, editing, motion graphics and sound design.",
          "Worked with the performance and marketing teams to plan and produce Meta ad campaigns, creating high-converting ad videos that drove engagement and lead generation.",
        ],
      },
      {
        date: "Dec 2022 - Apr 2024",
        role: "Video Editor / Content Editor",
        org: "Architmehrotra.in",
        url: "https://www.instagram.com/architmehrotra.in/",
        points: [
          "Edited 300+ short-form finance and business videos, helping grow the account past 300K Instagram followers.",
          "Created a signature style of quick cuts, transitions and subtitles that lifted engagement.",
          "Worked closely with creators to align visual storytelling with audience insights.",
        ],
      },
      {
        date: "Feb 2022 - Apr 2024",
        role: "Content Editor",
        org: "Caribbean Focus Lifestyle",
        url: "https://www.youtube.com/@CaribbeanFocus",
        type: "US",
        points: [
          "Edited long-form YouTube content and short clips, contributing to growth of 82K subscribers and 10M+ views.",
          "Developed energetic Caribbean-themed edits, improving viewer retention and engagement.",
          "Designed thumbnails and handled color grading for visual consistency.",
        ],
      },
      {
        date: "Aug 2023 - Jan 2024",
        role: "Jr. Video Editor",
        org: "The Perry Group | REAL",
        url: "https://www.linkedin.com/company/theperrygroup/",
        type: "US",
        points: [
          "Edited and formatted office tour, real estate knowledge, motivational and educational videos optimized for YouTube, TikTok and Instagram.",
        ],
      },
    ],

    // Add entries and the Education section appears on its own:
    //   { date: "2020 - 2023", title: "B.Sc. Something", org: "Some University" },
    education: [],
  },
};
