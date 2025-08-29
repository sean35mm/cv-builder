import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Server-side rendered public profile pages
http.route({
  path: "/@{username}",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const username = url.pathname.slice(2); // Remove /@

    try {
      // Fetch the profile data
      const profile = await ctx.runQuery(api.profiles.getProfileByUsername, { username });

      if (!profile || !profile.isPublic) {
        return new Response(generateNotFoundHTML(username), {
          status: 404,
          headers: {
            "Content-Type": "text/html",
            "Cache-Control": "public, max-age=300", // Cache for 5 minutes
          },
        });
      }

      // Generate the HTML with profile data
      const html = generateProfileHTML(profile);

      return new Response(html, {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "public, max-age=300", // Cache for 5 minutes
        },
      });
    } catch (error) {
      console.error("Error rendering profile:", error);
      return new Response(generateErrorHTML(), {
        status: 500,
        headers: {
          "Content-Type": "text/html",
        },
      });
    }
  }),
});

function generateProfileHTML(profile: any) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month] = dateString.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  };

  const experienceHTML = profile.experience && profile.experience.length > 0 
    ? `
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Experience</h2>
        <div class="space-y-6">
          ${profile.experience.map((exp: any) => `
            <div class="border-l-2 border-gray-200 pl-4">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-medium text-gray-900">${escapeHtml(exp.role)}</h3>
                <span class="text-sm text-gray-500 whitespace-nowrap ml-4">
                  ${formatDate(exp.startDate)} - ${exp.current ? "Present" : formatDate(exp.endDate || "")}
                </span>
              </div>
              <p class="text-gray-600 mb-2">${escapeHtml(exp.company)}</p>
              ${exp.description ? `<p class="text-gray-700 text-sm leading-relaxed">${escapeHtml(exp.description)}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

  const educationHTML = profile.education && profile.education.length > 0 
    ? `
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Education</h2>
        <div class="space-y-6">
          ${profile.education.map((edu: any) => `
            <div class="border-l-2 border-gray-200 pl-4">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-medium text-gray-900">${escapeHtml(edu.degree)}</h3>
                <span class="text-sm text-gray-500 whitespace-nowrap ml-4">
                  ${formatDate(edu.startDate)} - ${edu.current ? "Present" : formatDate(edu.endDate || "")}
                </span>
              </div>
              <p class="text-gray-600 mb-2">${escapeHtml(edu.school)}</p>
              ${edu.description ? `<p class="text-gray-700 text-sm leading-relaxed">${escapeHtml(edu.description)}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

  const skillsHTML = profile.skills && profile.skills.length > 0 
    ? `
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
        <div class="flex flex-wrap gap-2">
          ${profile.skills.map((skill: string) => `
            <span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
              ${escapeHtml(skill)}
            </span>
          `).join('')}
        </div>
      </div>
    ` : '';

  const contactHTML = (profile.email || profile.website || profile.github || profile.linkedin || profile.twitter) 
    ? `
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Contact</h2>
        <div class="space-y-2">
          ${profile.email ? `
            <div>
              <a href="mailto:${escapeHtml(profile.email)}" class="text-blue-600 hover:text-blue-800 transition-colors">
                ${escapeHtml(profile.email)}
              </a>
            </div>
          ` : ''}
          ${profile.website ? `
            <div>
              <a href="${profile.website.startsWith('http') ? escapeHtml(profile.website) : `https://${escapeHtml(profile.website)}`}" 
                 target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 transition-colors">
                ${escapeHtml(profile.website)}
              </a>
            </div>
          ` : ''}
          ${profile.github ? `
            <div>
              <a href="https://github.com/${escapeHtml(profile.github)}" 
                 target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 transition-colors">
                GitHub: ${escapeHtml(profile.github)}
              </a>
            </div>
          ` : ''}
          ${profile.linkedin ? `
            <div>
              <a href="https://linkedin.com/in/${escapeHtml(profile.linkedin)}" 
                 target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 transition-colors">
                LinkedIn: ${escapeHtml(profile.linkedin)}
              </a>
            </div>
          ` : ''}
          ${profile.twitter ? `
            <div>
              <a href="https://twitter.com/${escapeHtml(profile.twitter)}" 
                 target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 transition-colors">
                Twitter: @${escapeHtml(profile.twitter)}
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(profile.name)} - CV</title>
  <meta name="description" content="${escapeHtml(profile.bio || `${profile.name}'s professional CV and portfolio`)}">
  <meta name="keywords" content="CV, resume, ${escapeHtml(profile.name)}, ${profile.skills ? profile.skills.map((s: string) => escapeHtml(s)).join(', ') : ''}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="profile">
  <meta property="og:url" content="https://your-domain.com/@${escapeHtml(profile.username)}">
  <meta property="og:title" content="${escapeHtml(profile.name)} - CV">
  <meta property="og:description" content="${escapeHtml(profile.bio || `${profile.name}'s professional CV and portfolio`)}">
  <meta property="profile:first_name" content="${escapeHtml(profile.name.split(' ')[0] || '')}">
  <meta property="profile:last_name" content="${escapeHtml(profile.name.split(' ').slice(1).join(' ') || '')}">
  <meta property="profile:username" content="${escapeHtml(profile.username)}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary">
  <meta property="twitter:url" content="https://your-domain.com/@${escapeHtml(profile.username)}">
  <meta property="twitter:title" content="${escapeHtml(profile.name)} - CV">
  <meta property="twitter:description" content="${escapeHtml(profile.bio || `${profile.name}'s professional CV and portfolio`)}">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="https://your-domain.com/@${escapeHtml(profile.username)}">
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "${escapeHtml(profile.name)}",
    "description": "${escapeHtml(profile.bio || '')}",
    "url": "https://your-domain.com/@${escapeHtml(profile.username)}",
    ${profile.email ? `"email": "${escapeHtml(profile.email)}",` : ''}
    ${profile.website ? `"url": "${profile.website.startsWith('http') ? escapeHtml(profile.website) : `https://${escapeHtml(profile.website)}`}",` : ''}
    "jobTitle": "${escapeHtml(profile.title || '')}",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "${escapeHtml(profile.location || '')}"
    },
    "sameAs": [
      ${profile.github ? `"https://github.com/${escapeHtml(profile.github)}",` : ''}
      ${profile.linkedin ? `"https://linkedin.com/in/${escapeHtml(profile.linkedin)}",` : ''}
      ${profile.twitter ? `"https://twitter.com/${escapeHtml(profile.twitter)}"` : ''}
    ].filter(Boolean)
  }
  </script>
  
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body class="bg-white">
  <div class="min-h-screen">
    <div class="max-w-4xl mx-auto py-12 px-6">
      <div class="max-w-2xl mx-auto bg-white">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">${escapeHtml(profile.name)}</h1>
          ${profile.title ? `<p class="text-xl text-gray-600 mb-2">${escapeHtml(profile.title)}</p>` : ''}
          ${profile.location ? `<p class="text-gray-500 mb-4">${escapeHtml(profile.location)}</p>` : ''}
          ${profile.bio ? `<p class="text-gray-700 leading-relaxed">${escapeHtml(profile.bio)}</p>` : ''}
        </div>

        ${contactHTML}
        ${experienceHTML}
        ${educationHTML}
        ${skillsHTML}
        
        <div class="mt-12 pt-8 border-t border-gray-200 text-center">
          <p class="text-sm text-gray-500">
            Want to create your own CV? 
            <a href="/" class="text-blue-600 hover:text-blue-800 font-medium">Get started here</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function generateNotFoundHTML(username: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Profile Not Found - CV Builder</title>
  <meta name="description" content="The requested profile could not be found.">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
      <p class="text-gray-600 mb-4">
        The profile "@${escapeHtml(username)}" doesn't exist or is not public.
      </p>
      <a href="/" class="text-blue-600 hover:text-blue-800 font-medium">
        Create your own CV
      </a>
    </div>
  </div>
</body>
</html>
  `;
}

function generateErrorHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - CV Builder</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p class="text-gray-600 mb-4">
        We're having trouble loading this profile. Please try again later.
      </p>
      <a href="/" class="text-blue-600 hover:text-blue-800 font-medium">
        Go to homepage
      </a>
    </div>
  </div>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '<',
    '>': '>',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export default http;
