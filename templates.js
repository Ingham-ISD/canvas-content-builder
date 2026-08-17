// --- Canvas Agent Editor: Template Library ---
// Each template has a name, description, category, and the raw HTML.

function createTemplate(id, name, desc, category, html, options = {}) {
  return {
    id,
    name,
    desc,
    category,
    html,
    source: options.source || "Built-in",
    tags: options.tags || [],
    promptHint: options.promptHint || ""
  };
}

const TEMPLATES = [
  createTemplate(
    "assignment",
    "Assignment Page",
    "Header, intro, objectives, expandable steps, and due date",
    "Pages",
    `<div style="border-top: 6px solid #008ca7; padding: 1rem 1rem 0 1rem; text-align: center; font-family: Lato, Arial, sans-serif;">
    <div style="display: inline-block; background-color: #cde5e5; color: #000; padding: 4px 12px; border-radius: 25px; font-size: 0.85rem; margin-bottom: 0.5rem;">Course Title</div>
    <h2 style="margin: 0; font-size: 1.6rem; color: #001d55;">Assignment Title Goes Here</h2>
    <p style="margin: 0.25rem 0 1rem; color: #333; font-size: 0.95rem;">Ready, Set, Subtitle</p>
</div>
<div style="display: flex; align-items: center; margin: 2rem 0 1rem;">
    <hr style="flex: 1; border: none; border-top: 2px solid #ccc;" />
    <div style="margin: 0 1rem; text-align: center;"><img style="vertical-align: middle;" src="https://img.icons8.com/ios-filled/24/008ca7/speech-bubble--v1.png" alt="" /> <span style="font-family: Lato, Arial, sans-serif; font-size: 1.2rem; color: #005e75;">Introduction</span></div>
    <hr style="flex: 1; border: none; border-top: 2px solid #ccc;" />
</div>
<div style="display: flex; flex-wrap: wrap; gap: 1rem; font-family: Lato, Arial, sans-serif;">
    <div style="flex: 1 1 300px; border: 1px solid #ddd; border-radius: 8px; padding: 1rem;"><strong>Learning Objectives:</strong>
        <ol style="margin-top: 0.5rem; padding-left: 1.2rem;">
            <li>Objective One</li>
            <li>Objective Two</li>
            <li>Objective Three</li>
        </ol>
        <div style="margin-top: 0.5rem;"><span style="background-color: #005e75; color: #fff; padding: 4px 8px; font-size: 0.75rem; border-radius: 6px;">Time to Complete: 1 hour</span></div>
    </div>
    <div style="flex: 1 1 300px; border: 1px solid #ddd; border-radius: 8px; padding: 1rem;"><strong>Assignment Overview</strong>
        <p style="margin-top: 0.5rem;">Brief description of what this assignment is about and any key expectations.</p>
    </div>
</div>
<div style="display: flex; align-items: center; margin: 2rem 0 1rem;">
    <hr style="flex: 1; border: none; border-top: 2px solid #ccc;" />
    <div style="margin: 0 1rem; text-align: center;"><img style="vertical-align: middle;" src="https://img.icons8.com/ios-filled/24/008ca7/document--v1.png" alt="" /> <span style="font-family: Lato, Arial, sans-serif; font-size: 1.2rem; color: #005e75;">Instructions</span></div>
    <hr style="flex: 1; border: none; border-top: 2px solid #ccc;" />
</div>
<div style="font-family: Lato, Arial, sans-serif; max-width: 900px; margin: 0 auto 1.5rem auto;">
    <details style="border: 1px solid #ddd; border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; background-color: #fafafa;">
        <summary style="color: #005e75; cursor: pointer; display: flex; align-items: center; justify-content: space-between;"><span>Step 1: Get Started</span></summary>
        <div style="margin-top: 0.5rem; font-size: 0.95rem; color: #333;">
            <p style="margin-top: 0.25rem;">Instructions for Step 1 go here.</p>
        </div>
    </details>
    <details style="border: 1px solid #ddd; border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; background-color: #fafafa;">
        <summary style="color: #005e75; cursor: pointer; display: flex; align-items: center; justify-content: space-between;"><span>Step 2: Do the Work</span></summary>
        <div style="margin-top: 0.5rem; font-size: 0.95rem; color: #333;">
            <p style="margin-top: 0.25rem;">Step 2 directions, tips, or embedded media can be placed here.</p>
        </div>
    </details>
    <details style="border: 1px solid #ddd; border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; background-color: #fafafa;">
        <summary style="color: #005e75; cursor: pointer; display: flex; align-items: center; justify-content: space-between;"><span>Step 3: Finish &amp; Submit</span></summary>
        <div style="margin-top: 0.5rem; font-size: 0.95rem; color: #333;">
            <p style="margin-top: 0.25rem;">Final submission steps and resources.</p>
        </div>
    </details>
</div>
<div style="display: flex; align-items: center; margin: 2rem 0 1rem;">
    <hr style="flex: 1; border: none; border-top: 2px solid #ccc;" />
    <div style="margin: 0 1rem; text-align: center;"><img style="vertical-align: middle;" src="https://img.icons8.com/ios-filled/24/008ca7/calendar--v1.png" alt="" /> <span style="font-family: Lato, Arial, sans-serif; font-size: 1.2rem; color: #005e75;">Due Date</span></div>
    <hr style="flex: 1; border: none; border-top: 2px solid #ccc;" />
</div>
<p style="font-family: Lato, Arial, sans-serif; font-size: 0.95rem; margin-bottom: 2rem;">Assignment is due <strong>Sunday by 11:59 PM</strong> [adjust as needed].</p>`,
    { tags: ["assignment", "steps", "due date"], promptHint: "Customize the headings, learning objectives, instructions, and due-date language for the teacher's assignment." }
  ),
  createTemplate(
    "lesson-overview",
    "Lesson Overview",
    "Banner header, learning targets, and content sections",
    "Pages",
    `<div style="background: linear-gradient(to right, #15616f, #001d55); padding: 2rem 1.5rem; text-align: center; margin-bottom: 1.5rem;">
    <h2 style="font-family: Cambria, serif; font-size: 2rem; color: #e5d0b1; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">Lesson Title</h2>
    <p style="font-family: Lato, Arial, sans-serif; font-size: 1.1rem; color: #ffffff; margin: 0.5rem 0 0;">Module X &bull; Week X</p>
</div>
<div style="display: flex; flex-wrap: wrap; gap: 1rem; font-family: Lato, Arial, sans-serif; margin-bottom: 1.5rem;">
    <div style="flex: 1 1 300px; background-color: #eef7f8; border-left: 5px solid #005e75; padding: 1rem; border-radius: 8px;">
        <strong style="color: #005e75;">Learning Targets</strong>
        <ul style="margin-top: 0.5rem; padding-left: 1.2rem;">
            <li>Target one goes here</li>
            <li>Target two goes here</li>
            <li>Target three goes here</li>
        </ul>
    </div>
    <div style="flex: 1 1 300px; background-color: #fff3cd; border-left: 5px solid #e59a24; padding: 1rem; border-radius: 8px;">
        <strong style="color: #e59a24;">Key Vocabulary</strong>
        <ul style="margin-top: 0.5rem; padding-left: 1.2rem;">
            <li><strong>Term 1</strong> &mdash; definition</li>
            <li><strong>Term 2</strong> &mdash; definition</li>
        </ul>
    </div>
</div>
<div style="display: flex; align-items: center; margin: 2rem 0 1rem;">
    <hr style="flex: 1; border: none; border-top: 2px solid #ccc;" />
    <div style="margin: 0 1rem; text-align: center;"><img style="vertical-align: middle;" src="https://img.icons8.com/ios-filled/24/008ca7/book-shelf.png" alt="" /> <span style="font-family: Lato, Arial, sans-serif; font-size: 1.2rem; color: #005e75;">Lesson Content</span></div>
    <hr style="flex: 1; border: none; border-top: 2px solid #ccc;" />
</div>
<div style="font-family: Lato, Arial, sans-serif; margin-bottom: 1.5rem;">
    <p>Introduce the main topic here. This is where the body of the lesson goes &mdash; text, images, embedded videos, or links to resources.</p>
</div>
<div style="display: flex; align-items: center; margin: 2rem 0 1rem;">
    <hr style="flex: 1; border: none; border-top: 2px solid #ccc;" />
    <div style="margin: 0 1rem; text-align: center;"><img style="vertical-align: middle;" src="https://img.icons8.com/ios-filled/24/008ca7/checkmark--v1.png" alt="" /> <span style="font-family: Lato, Arial, sans-serif; font-size: 1.2rem; color: #005e75;">Check for Understanding</span></div>
    <hr style="flex: 1; border: none; border-top: 2px solid #ccc;" />
</div>
<div style="background-color: #e6ffed; border-left: 5px solid #28a745; padding: 1rem; border-radius: 8px; font-family: Lato, Arial, sans-serif;">
    <strong>Reflection Prompt:</strong>
    <p style="margin-top: 0.5rem;">What is one thing you learned and one question you still have?</p>
</div>`,
    { tags: ["lesson", "targets", "overview"], promptHint: "Customize the banner, targets, vocabulary, and reflection to fit the lesson topic." }
  ),
  createTemplate(
    "two-column",
    "Two-Column Layout",
    "Side-by-side content with tip and info panels",
    "Layouts",
    `<div style="display: flex; flex-wrap: wrap; gap: 1.5rem; font-family: Lato, Arial, sans-serif; margin-bottom: 1.5rem;">
    <div style="flex: 1 1 45%; min-width: 280px;">
        <h3 style="color: #001d55; margin-top: 0;">Main Content</h3>
        <p>This is the primary content column. Use it for lesson text, instructions, or any main body content. It will stack on mobile.</p>
        <div style="background-color: #e6ffed; border-left: 5px solid #28a745; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
            <strong>Tip:</strong>
            <p style="margin-top: 0.25rem;">You can place tip boxes, images, or any other content inside columns.</p>
        </div>
    </div>
    <div style="flex: 1 1 45%; min-width: 280px;">
        <h3 style="color: #001d55; margin-top: 0;">Sidebar</h3>
        <div style="background-color: #eef7f8; border-left: 5px solid #005e75; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <strong style="color: #005e75;">Quick Reference</strong>
            <ul style="margin-top: 0.5rem; padding-left: 1.2rem;">
                <li>Key point one</li>
                <li>Key point two</li>
                <li>Key point three</li>
            </ul>
        </div>
        <div style="background-color: #fff3cd; border-left: 5px solid #ffa500; padding: 1rem; border-radius: 8px;">
            <strong>Reminder:</strong>
            <p style="margin-top: 0.25rem;">Important dates, links, or notes go here.</p>
        </div>
    </div>
</div>`,
    { tags: ["layout", "columns", "sidebar"], promptHint: "Use the left side for main instruction and the right side for references, reminders, or supports." }
  ),
  createTemplate(
    "info-panels",
    "Info Panel Set",
    "Tip, caution, and info boxes with icons",
    "Components",
    `<div style="background-color: #eef7f8; border-left: 5px solid #005e75; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-family: Lato, Arial, sans-serif;">
    <strong style="color: #005e75;">&#x1f4a1; Information</strong>
    <p style="margin-top: 0.25rem;">Use this panel for general information, context, or helpful notes for students.</p>
</div>
<div style="background-color: #e6ffed; border-left: 5px solid #28a745; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-family: Lato, Arial, sans-serif;">
    <strong style="color: #28a745;">&#x2705; Success / Tip</strong>
    <p style="margin-top: 0.25rem;">Use this panel for tips, best practices, or confirmation messages.</p>
</div>
<div style="background-color: #fff3cd; border-left: 5px solid #ffa500; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-family: Lato, Arial, sans-serif;">
    <strong style="color: #e59a24;">&#x26a0;&#xfe0f; Caution</strong>
    <p style="margin-top: 0.25rem;">Use this panel for warnings, common mistakes, or things students should watch out for.</p>
</div>
<div style="background-color: #fef2f2; border-left: 5px solid #9c3225; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-family: Lato, Arial, sans-serif;">
    <strong style="color: #9c3225;">&#x1f6a8; Important</strong>
    <p style="margin-top: 0.25rem;">Use this panel for critical information, deadlines, or required actions.</p>
</div>`,
    { tags: ["components", "panels", "alerts"], promptHint: "Adapt these panels into teacher notes, tips, cautions, or critical reminders." }
  ),
  createTemplate(
    "expandable-steps",
    "Expandable Steps",
    "Collapsible step-by-step instructions",
    "Components",
    `<div style="font-family: Lato, Arial, sans-serif; max-width: 900px; margin: 0 auto;">
    <h3 style="color: #001d55; margin-bottom: 1rem;">Instructions</h3>
    <details style="border: 1px solid #ddd; border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; background-color: #fafafa;">
        <summary style="color: #005e75; cursor: pointer;"><strong>Step 1:</strong> Getting Started</summary>
        <div style="margin-top: 0.5rem; font-size: 0.95rem; color: #333; padding-left: 0.5rem;">
            <p>Describe what the student should do first. Include any links or resources they need.</p>
        </div>
    </details>
    <details style="border: 1px solid #ddd; border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; background-color: #fafafa;">
        <summary style="color: #005e75; cursor: pointer;"><strong>Step 2:</strong> Main Activity</summary>
        <div style="margin-top: 0.5rem; font-size: 0.95rem; color: #333; padding-left: 0.5rem;">
            <p>Detail the core task. You can embed videos, images, or links here.</p>
        </div>
    </details>
    <details style="border: 1px solid #ddd; border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; background-color: #fafafa;">
        <summary style="color: #005e75; cursor: pointer;"><strong>Step 3:</strong> Wrap Up &amp; Submit</summary>
        <div style="margin-top: 0.5rem; font-size: 0.95rem; color: #333; padding-left: 0.5rem;">
            <p>Final instructions, submission details, and any checklists.</p>
        </div>
    </details>
</div>`,
    { tags: ["steps", "details", "instructions"], promptHint: "Turn the steps into concrete directions with the teacher's real sequence and resources." }
  ),
  createTemplate(
    "bay-briefing",
    "Bay Briefing",
    "Automotive bay intro with success criteria table and video area",
    "Examples",
    `<div style="font-family: Lato, Arial, sans-serif; max-width: 900px; margin: 0 auto; color: #333; line-height: 1.6;">
    <div style="border-top: 6px solid #005e75; padding-top: 1rem; text-align: center;">
        <div style="display: inline-block; background-color: #d9eef0; color: #003b49; padding: 4px 12px; border-radius: 999px; font-size: 0.9rem; margin-bottom: 0.75rem;">Bay Template</div>
        <h2 style="margin: 0; color: #003b49;">Bay X Briefing &amp; Success Criteria</h2>
        <p style="margin-top: 0.4rem;">Use this page to orient students before they start work in a zone.</p>
    </div>
    <div style="background-color: #f4fafb; border-left: 5px solid #005e75; padding: 1rem; border-radius: 8px; margin: 1.5rem 0;">
        <h3 style="margin-top: 0; color: #005e75;">What Students Need to Know</h3>
        <ul>
            <li>What this bay or zone is for</li>
            <li>What equipment and tools are located here</li>
            <li>What success looks like this rotation</li>
            <li>What must be completed before a live proficiency check</li>
        </ul>
    </div>
    <div style="background-color: #ffffff; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid #d6d6d6;">
        <h3 style="margin-top: 0; color: #005e75;">Bay Intro Video Placeholder</h3>
        <p>Embed a short instructor video here showing the bay layout, major tools, safety reminders, and the mission for the rotation.</p>
    </div>
    <div style="background-color: #ffffff; padding: 1rem; border-radius: 8px; border: 1px solid #d6d6d6;">
        <h3 style="margin-top: 0; color: #005e75;">How the Proficiency Score Is Determined</h3>
        <p>Students receive one overall system score and one employability score. Use the table below to explain what informs the overall system score.</p>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="padding: 8px; background-color: #eef7f8; border: 1px solid #cccccc;" scope="col">Success Criteria</th>
                    <th style="padding: 8px; background-color: #eef7f8; border: 1px solid #cccccc;" scope="col">What This Looks Like</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding: 8px; border: 1px solid #cccccc;">Identify</td>
                    <td style="padding: 8px; border: 1px solid #cccccc;">Identify parts, systems, and the purpose of the task.</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #cccccc;">Inspect</td>
                    <td style="padding: 8px; border: 1px solid #cccccc;">Use the right tools and compare findings to specifications.</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #cccccc;">Diagnose</td>
                    <td style="padding: 8px; border: 1px solid #cccccc;">Determine the likely issue, cause, or service need.</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #cccccc;">Repair</td>
                    <td style="padding: 8px; border: 1px solid #cccccc;">Perform the work safely and to industry expectations.</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #cccccc;">Documentation</td>
                    <td style="padding: 8px; border: 1px solid #cccccc;">Record findings clearly, neatly, and completely.</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>`,
    { source: "Examples Folder/Bay briefing auto", tags: ["automotive", "briefing", "success criteria"], promptHint: "Customize the bay title, success criteria, video area, and system-specific scoring language." }
  ),
  createTemplate(
    "intro-new-media",
    "New Media Introduction",
    "Bold intro page with numbered sections, media, and resources",
    "Examples",
    `<div class="iisd-page">
    <div style="background-color: #f7f3ed; border-radius: 18px; overflow: hidden; margin-bottom: 2rem; color: #1b120c; border: 1px solid #e2d6c8;">
        <div style="background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 58%, #f97316 100%); padding: 1.25rem 1.25rem 2rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 2rem;">
                <div style="font-size: 0.8rem; color: #7c2d12;">Illustration Unit</div>
                <div style="border-width: 1px; border-style: solid; border-color: rgba(124, 45, 18, 0.35); border-radius: 999px; padding: 0.35rem 0.75rem; font-size: 0.85rem; color: #7c2d12; background-color: rgba(255, 255, 255, 0.48);">Intro Screen</div>
            </div>
            <h2 style="margin: 0; font-size: 2.5rem; line-height: 1.08;">Intro to Elements of Content Creation</h2>
            <p style="font-size: 1.05rem; line-height: 1.5; margin: 0.9rem 0 0; color: #431407;">Explore the idea, collect the key targets, and preview the examples before moving into practice.</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1px; background-color: #e7c5a7;">
            <div style="background-color: #fff7ed; padding: 0.8rem 0.35rem; text-align: center;"><div style="font-size: 1.05rem; color: #c2410c;">01</div><div style="font-size: 0.68rem; color: #7c2d12;">Targets</div></div>
            <div style="background-color: #fff7ed; padding: 0.8rem 0.35rem; text-align: center;"><div style="font-size: 1.05rem; color: #c2410c;">02</div><div style="font-size: 0.68rem; color: #7c2d12;">Overview</div></div>
            <div style="background-color: #fff7ed; padding: 0.8rem 0.35rem; text-align: center;"><div style="font-size: 1.05rem; color: #c2410c;">03</div><div style="font-size: 0.68rem; color: #7c2d12;">Notes</div></div>
            <div style="background-color: #fff7ed; padding: 0.8rem 0.35rem; text-align: center;"><div style="font-size: 1.05rem; color: #c2410c;">04</div><div style="font-size: 0.68rem; color: #7c2d12;">Examples</div></div>
            <div style="background-color: #fff7ed; padding: 0.8rem 0.35rem; text-align: center;"><div style="font-size: 1.05rem; color: #c2410c;">05</div><div style="font-size: 0.68rem; color: #7c2d12;">Resources</div></div>
        </div>
    </div>
    <div style="background-color: #fff7ed; border-radius: 14px; padding: 1.35rem; margin-bottom: 1rem; border: 1px solid #fed7aa;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
            <div style="background-color: #c2410c; color: #ffffff; border-radius: 12px; min-width: 2.35rem; height: 2.35rem; display: flex; align-items: center; justify-content: center;">01</div>
            <h3 style="margin: 0; color: #431407;">Learning Targets</h3>
        </div>
        <p style="margin-bottom: 0; color: #1f2937; line-height: 1.55;">After completing this page, you will be able to:</p>
        <ul style="margin-top: 0.5rem; margin-bottom: 0; padding-left: 1.2rem; color: #1f2937; line-height: 1.55;">
            <li>Identify the Elements of Content Creation.</li>
            <li>Define the Elements of Content Creation.</li>
            <li>Apply the Elements of Content Creation.</li>
        </ul>
    </div>
    <div style="background-color: #ffffff; border-radius: 14px; padding: 1.35rem; margin-bottom: 1rem; border: 1px solid #ead8c5;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
            <div style="background-color: #9a3412; color: #ffffff; border-radius: 12px; min-width: 2.35rem; height: 2.35rem; display: flex; align-items: center; justify-content: center;">02</div>
            <h3 style="margin: 0; color: #431407;">Overview</h3>
        </div>
        <p style="margin-top: 0; color: #1f2937; line-height: 1.55;"><strong>Objective:</strong></p>
        <p style="color: #1f2937; line-height: 1.55;">In this unit, you will identify, define, and apply the core elements that make up professional content. Think of these elements as your creative toolkit.</p>
    </div>
    <div style="background-color: #1b120c; border-radius: 14px; padding: 1.35rem; color: #ffffff; margin-bottom: 1rem; border: 1px solid #3a2417;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
            <div style="background-color: #fdba74; color: #1b120c; border-radius: 12px; min-width: 2.35rem; height: 2.35rem; display: flex; align-items: center; justify-content: center;">03</div>
            <h3 style="margin: 0; color: #fed7aa;">Teacher Notes</h3>
        </div>
        <p style="margin-top: 0; color: #fff7ed; line-height: 1.55;">Here is a copy of the presentation on Elements of Content Creation.</p>
    </div>
    <div style="background-color: #ffffff; border-radius: 14px; padding: 1.35rem; margin-bottom: 1rem; border: 1px solid #ead8c5;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
            <div style="background-color: #b45309; color: #ffffff; border-radius: 12px; min-width: 2.35rem; height: 2.35rem; display: flex; align-items: center; justify-content: center;">04</div>
            <h3 style="margin: 0; color: #431407;">Student and Professional Examples</h3>
        </div>
        <p style="margin-top: 0; color: #1f2937; line-height: 1.55;">The chart below shows how these concepts appear in real creative work.</p>
    </div>
    <div style="background-color: #fffbeb; border-radius: 14px; padding: 1.35rem; margin-bottom: 2rem; border: 1px solid #fed7aa;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
            <div style="background-color: #7c2d12; color: #ffffff; border-radius: 12px; min-width: 2.35rem; height: 2.35rem; display: flex; align-items: center; justify-content: center;">05</div>
            <h3 style="margin: 0; color: #78350f;">Additional Resources</h3>
        </div>
        <p style="margin: 0; color: #78350f; line-height: 1.55;">Additional watch, read, and explore resources can be added here as this section develops.</p>
    </div>
</div>`,
    { source: "Examples Folder/Introduction Page New Media", tags: ["introduction", "new media", "numbered sections"], promptHint: "Keep the numbered section rhythm but customize the unit branding, learning targets, examples, and resources." }
  ),
  createTemplate(
    "lesson-overview-ma",
    "Module Overview MA",
    "Clinical module overview with learning targets and checkoff reminders",
    "Examples",
    `<div class="iisd-page">
    <div style="background-color: #f1f8fc; padding: 1.5rem; border-radius: 8px; border-left: 5px solid #005e75; margin-bottom: 2rem;">
        <h2 style="color: #005e75; font-size: 1.8em; margin-top: 0; margin-bottom: 0.5rem;">Module [X]: [Module Title] Overview</h2>
        <p style="color: #333333; font-size: 1.1em; margin: 0;">Welcome to this module. Below you will find your learning objectives, clinical skill targets, and important reminders to help you prepare for your upcoming assessments and checkoffs.</p>
    </div>
    <div style="display: flex; align-items: center; margin: 2rem 0 1.5rem;">
        <hr style="flex: 1 1 0%; border-width: 2px medium medium; border-style: solid none none; border-color: #cccccc currentcolor currentcolor;" />
        <div style="margin: 0 1rem; text-align: center;"><img src="https://img.icons8.com/ios-filled/24/005e75/document--v1.png" alt="" /> <span style="font-family: Lato, Arial, sans-serif; font-size: 1.2rem; color: #005e75;">Module Focus</span></div>
        <hr style="flex: 1 1 0%; border-width: 2px medium medium; border-style: solid none none; border-color: #cccccc currentcolor currentcolor;" />
    </div>
    <div class="iisd-flex-columns" style="gap: 1.5rem; flex-wrap: wrap; display: flex; margin-bottom: 2rem;">
        <div class="iisd-left-column" style="flex: 1 1 45%; min-width: 280px; margin-bottom: 1rem;">
            <div style="background-color: #ffffff; border-width: 4px 1px 1px; border-style: solid; border-color: #005e75; padding: 1.25rem; border-radius: 8px; height: 100%;">
                <h3 style="color: #005e75; margin-top: 0; font-size: 1.3rem;">Learning Targets</h3>
                <p style="color: #333333;">By the end of this module, you should be able to:</p>
                <ul style="color: #333333; padding-left: 1.5rem;">
                    <li style="margin-bottom: 0.5rem;">[Insert core theory objective]</li>
                    <li style="margin-bottom: 0.5rem;">[Insert secondary objective]</li>
                    <li style="margin-bottom: 0.5rem;">[Insert tertiary objective or terminology focus]</li>
                </ul>
            </div>
        </div>
        <div class="iisd-sidebar" style="flex: 1 1 45%; min-width: 280px; margin-bottom: 1rem;">
            <div style="background-color: #eef7f8; border-width: 4px 1px 1px; border-style: solid; border-color: #007e8a; padding: 1.25rem; border-radius: 8px; height: 100%;">
                <h3 style="color: #005e75; margin-top: 0; font-size: 1.3rem;">Clinical Skills for Checkoff</h3>
                <p style="color: #333333;">Prepare to be checked off in the lab on the following clinical competencies:</p>
                <ul style="color: #333333; padding-left: 1.5rem;">
                    <li style="margin-bottom: 0.5rem;"><strong>Skill 1:</strong> [Insert Skill Name]</li>
                    <li style="margin-bottom: 0.5rem;"><strong>Skill 2:</strong> [Insert Skill Name]</li>
                    <li style="margin-bottom: 0.5rem;"><strong>Skill 3:</strong> [Insert Skill Name]</li>
                </ul>
            </div>
        </div>
    </div>
    <div style="display: block; clear: both; padding-top: 1.5rem; margin-top: 2rem;">
        <div style="background-color: #fff3cd; border-left: 5px solid #ffa500; padding: 1.25rem; border-radius: 8px;">
            <div style="display: flex; align-items: center; margin-bottom: 0.5rem;"><img style="margin-right: 0.5rem;" src="https://img.icons8.com/ios-filled/20/b37400/calendar--v1.png" alt="" /> <strong style="color: #805300; font-size: 1.1em;">Important Reminder</strong></div>
            <p style="color: #333333; margin: 0;">Please ensure you have reviewed the step-by-step procedure rubrics in your lab manual before arriving at the clinical lab. <strong>Your Checkoff Window closes on [Insert Date/Time].</strong> Schedule peer-practice time early!</p>
        </div>
    </div>
</div>`,
    { source: "Examples Folder/Lesson Overview MA", tags: ["module overview", "clinical", "checkoff"], promptHint: "Use this for health or clinical modules with clear objectives, skill targets, and scheduling reminders." }
  ),
  createTemplate(
    "practice-new-media",
    "New Media Practice Page",
    "Practice assignment flow with requirements, directions, tracker, and submission",
    "Examples",
    `<div class="iisd-page">
    <div style="background-color: #1b120c; border-radius: 18px; overflow: hidden; margin-bottom: 2rem; color: #ffffff; border: 1px solid #3a2417;">
        <div style="background: linear-gradient(135deg, #1b120c 0%, #4a2612 52%, #9a3412 100%); padding: 1.25rem 1.25rem 2rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 2rem;">
                <div style="font-size: 0.8rem; color: #fed7aa;">Illustration Unit</div>
                <div style="border-width: 1px; border-style: solid; border-color: rgba(255, 255, 255, 0.35); border-radius: 999px; padding: 0.35rem 0.75rem; font-size: 0.85rem; color: #ffedd5;">Practice Mode</div>
            </div>
            <h2 style="margin: 0; font-size: 2.5rem; line-height: 1.08;">Elements of Content Creation Practice</h2>
            <p style="font-size: 1.05rem; line-height: 1.5; margin: 0.9rem 0 0; color: #ffedd5;">Apply your learning, submit your current draft, and use feedback to revise toward proficiency.</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background-color: #3a2417;">
            <div style="background-color: #2a1a11; padding: 0.9rem 0.35rem; text-align: center;"><div style="font-size: 1.15rem; color: #fdba74;">01</div><div style="font-size: 0.7rem; color: #f5e7d8;">Requirements</div></div>
            <div style="background-color: #2a1a11; padding: 0.9rem 0.35rem; text-align: center;"><div style="font-size: 1.15rem; color: #fdba74;">02</div><div style="font-size: 0.7rem; color: #f5e7d8;">Directions</div></div>
            <div style="background-color: #2a1a11; padding: 0.9rem 0.35rem; text-align: center;"><div style="font-size: 1.15rem; color: #fdba74;">03</div><div style="font-size: 0.7rem; color: #f5e7d8;">Tracker</div></div>
            <div style="background-color: #2a1a11; padding: 0.9rem 0.35rem; text-align: center;"><div style="font-size: 1.15rem; color: #fdba74;">04</div><div style="font-size: 0.7rem; color: #f5e7d8;">Submit</div></div>
        </div>
    </div>
    <div style="background-color: #fff7ed; border-radius: 14px; padding: 1.35rem; margin-bottom: 1rem; border: 1px solid #fed7aa;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
            <div style="background-color: #b45309; color: #ffffff; border-radius: 12px; min-width: 2.35rem; height: 2.35rem; display: flex; align-items: center; justify-content: center;">01</div>
            <h3 style="margin: 0; color: #431407;">Requirements</h3>
        </div>
        <ul style="margin: 0; padding-left: 1.2rem; color: #1f2937; line-height: 1.55;">
            <li>Add the required products or draft components students must complete.</li>
            <li>Add any process evidence, sketchbook work, planning materials, or checkpoints students must include.</li>
            <li>Add quality expectations, file requirements, or non-negotiables for this practice.</li>
        </ul>
    </div>
    <div style="background-color: #ffffff; border-radius: 14px; padding: 1.35rem; margin-bottom: 1rem; border: 1px solid #ead8c5;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
            <div style="background-color: #4a2612; color: #ffffff; border-radius: 12px; min-width: 2.35rem; height: 2.35rem; display: flex; align-items: center; justify-content: center;">02</div>
            <h3 style="margin: 0; color: #431407;">Directions</h3>
        </div>
        <p style="margin-top: 0; color: #1f2937; line-height: 1.55;">Explain the workflow students should follow to complete this practice assignment.</p>
        <ol style="margin-bottom: 0; padding-left: 1.35rem; color: #1f2937; line-height: 1.55;">
            <li>Add the first action students should take after reviewing the introduction materials.</li>
            <li>Add the main creation or practice steps students need to complete.</li>
            <li>Add any revision, reflection, or teacher check-in expectations before submission.</li>
        </ol>
    </div>
    <div style="background-color: #fffbeb; border-radius: 14px; padding: 1.35rem; margin-bottom: 1rem; border: 1px solid #fed7aa;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
            <div style="background-color: #b45309; color: #ffffff; border-radius: 12px; min-width: 2.35rem; height: 2.35rem; display: flex; align-items: center; justify-content: center;">03</div>
            <h3 style="margin: 0; color: #78350f;">Rubric Student Tracker</h3>
        </div>
        <p style="margin: 0; color: #78350f; line-height: 1.55;">Open the next item in the module, <strong>Elements of Content Creation Practice Rubric Student Tracker</strong>. That Google document is where you and Nicki will track detailed feedback, revisions, and evidence of progress.</p>
    </div>
    <div style="background-color: #1b120c; border-radius: 14px; padding: 1.35rem; color: #ffffff; margin-bottom: 2rem; border: 1px solid #3a2417;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
            <div style="background-color: #fdba74; color: #1b120c; border-radius: 12px; min-width: 2.35rem; height: 2.35rem; display: flex; align-items: center; justify-content: center;">04</div>
            <h3 style="margin: 0; color: #fed7aa;">Submission and Next Steps</h3>
        </div>
        <p style="margin-top: 0; color: #fff7ed; line-height: 1.55;">At this point, students will submit their current draft and meet with Nicki to receive feedback.</p>
        <p style="color: #fff7ed; line-height: 1.55;">After that meeting, students will have a window of time to revise and resubmit work that clearly shows evidence of their changes.</p>
        <p style="margin-bottom: 0; color: #fff7ed; line-height: 1.55;">Students may then meet again for more feedback and continue repeating this process until they reach proficiency or run out of time.</p>
    </div>
</div>`,
    { source: "Examples Folder/Practice Page New Media", tags: ["practice", "assignment", "workflow"], promptHint: "Use this for a practice page that guides students from requirements through submission and revision." }
  ),
  createTemplate(
    "cos-homepage-1",
    "COS Homepage I",
    "Full cosmetology homepage with hero, quick nav, instructors, and career resources",
    "Homepages",
    `<div class="iisd-page">
<div style="background-color: #06303a; border-radius: 18px; overflow: hidden; border: 1px solid #0a3a47; margin-bottom: 2rem; color: #ffffff;">
<div style="background: linear-gradient(110deg, rgba(6,20,26,0.94) 0%, rgba(10,58,71,0.86) 42%, rgba(157,23,93,0.58) 100%); padding: 1.75rem 1.75rem 2rem;">
<div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.4rem;">
<div style="font-family: Georgia, 'Times New Roman', serif; font-size: 0.82rem; font-weight: 700; letter-spacing: 0.14em; color: #ffd9e8;">INGHAM ISD &nbsp;&middot;&nbsp; COSMETOLOGY PATHWAY</div>
<div style="font-family: Georgia, serif; font-size: 0.78rem; letter-spacing: 0.1em; color: #ffe3ee; border: 1px solid rgba(255,209,228,0.55); border-radius: 999px; padding: 0.3rem 0.8rem;">EST. AT WILSON TALENT CENTER</div>
</div>
<h2 style="font-family: Georgia, 'Times New Roman', serif; margin: 0; font-size: 3rem; line-height: 1.05; color: #ffffff;">Cosmetology</h2>
<div style="width: 84px; height: 4px; background: linear-gradient(90deg, #ec4899, #f9a8d4); border-radius: 2px; margin: 0.85rem 0 1rem;"></div>
<p style="font-family: Helvetica, Arial, sans-serif; font-size: 1.22rem; line-height: 1.5; margin: 0; max-width: 640px; color: #ffffff;">Master the art and science of hair, skin, and makeup and build the polished, professional skills that launch a real career in beauty.</p>
</div>
</div>
<h2 style="font-family: Georgia, 'Times New Roman', serif; color: #06303a; border-bottom: 3px solid #ec4899; padding-bottom: 0.3rem; margin: 0 0 1rem;">Quick Navigation</h2>
<div style="display: flex; flex-wrap: wrap; gap: 0.85rem; margin-bottom: 2rem;">
<a href="/courses/[COURSE_ID]/modules" style="flex: 1 1 200px; min-width: 160px; text-align: center; background: linear-gradient(135deg, #007e8a 0%, #06303a 100%); color: #ffffff; font-family: Helvetica, Arial, sans-serif; font-weight: 700; font-size: 1.25rem; padding: 1.4rem 0.75rem; border-radius: 12px; border-bottom: 5px solid #ec4899; text-decoration: none;">Modules</a>
<a href="/courses/[COURSE_ID]/announcements" style="flex: 1 1 200px; min-width: 160px; text-align: center; background: linear-gradient(135deg, #007e8a 0%, #06303a 100%); color: #ffffff; font-family: Helvetica, Arial, sans-serif; font-weight: 700; font-size: 1.25rem; padding: 1.4rem 0.75rem; border-radius: 12px; border-bottom: 5px solid #ec4899; text-decoration: none;">Announcements</a>
<a href="/courses/[COURSE_ID]/grades" style="flex: 1 1 200px; min-width: 160px; text-align: center; background: linear-gradient(135deg, #007e8a 0%, #06303a 100%); color: #ffffff; font-family: Helvetica, Arial, sans-serif; font-weight: 700; font-size: 1.25rem; padding: 1.4rem 0.75rem; border-radius: 12px; border-bottom: 5px solid #ec4899; text-decoration: none;">My Grades</a>
</div>
<div style="display: flex; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 2rem;">
<div style="flex: 2 1 360px; background: linear-gradient(180deg, #ffffff 0%, #f4fbfc 100%); border: 1px solid #d7e1e4; border-top: 5px solid #006a78; border-radius: 14px; padding: 1.6rem;">
<h2 style="font-family: Georgia, 'Times New Roman', serif; margin: 0 0 0.6rem; color: #06303a;">Welcome to the course</h2>
<p style="font-family: Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.6; margin: 0 0 0.9rem;">This program is where artistry meets technique. Students build real hands-on skills in haircutting and styling, color, skin care, and makeup while developing sanitation, professionalism, and client-care habits.</p>
<p style="font-family: Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.6; margin: 0;">Work through modules in order, check announcements regularly, and use the reminders in the sidebar to stay on track.</p>
</div>
<div style="flex: 1 1 260px; background: linear-gradient(180deg, #fdeef4 0%, #fbdce9 100%); border: 1px solid #f5c6da; border-top: 5px solid #be185d; border-radius: 14px; padding: 1.6rem; color: #4a1d33;">
<h2 style="font-family: Georgia, 'Times New Roman', serif; margin: 0 0 0.75rem; color: #9d174d;">Your Instructors</h2>
<p style="font-family: Helvetica, Arial, sans-serif; margin: 0 0 0.9rem; line-height: 1.6;"><strong>Instructor 1</strong><br /><a href="mailto:[email]" style="color: #006a78; text-decoration: underline;">[email]</a></p>
<p style="font-family: Helvetica, Arial, sans-serif; margin: 0; line-height: 1.6; font-size: 0.95rem;"><strong>Office hours:</strong> [add days/times]<br /><strong>Response time:</strong> Within one school day</p>
</div>
</div>
<h2 style="font-family: Georgia, 'Times New Roman', serif; color: #06303a; border-bottom: 3px solid #ec4899; padding-bottom: 0.3rem; margin: 0 0 1rem;">Career Resources</h2>
<div style="background: linear-gradient(180deg, #ffffff 0%, #fdf2f7 100%); border: 1px solid #f1d4e1; border-top: 5px solid #ec4899; border-radius: 14px; padding: 1.6rem; margin-bottom: 2rem;">
<ul style="font-family: Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.7; margin: 0; padding-left: 1.25rem;">
<li><a href="#" style="color: #9d174d; text-decoration: underline;">Michigan licensing and state board info</a></li>
<li><a href="#" style="color: #9d174d; text-decoration: underline;">Portfolio building resources</a></li>
<li><a href="#" style="color: #9d174d; text-decoration: underline;">Local salon and spa opportunities</a></li>
</ul>
</div>
</div>`,
    { source: "Canvas Reference Files/Top-Level Templates/cos1-homepage.html", tags: ["homepage", "cos", "cosmetology"], promptHint: "Use this for a polished course landing page with quick links, instructor info, and pathway branding." }
  ),
  createTemplate(
    "cos-homepage-2",
    "COS Homepage II",
    "Second cosmetology homepage variant for multi-course or level-two branding",
    "Homepages",
    `<div class="iisd-page">
<div style="background-color: #06303a; border-radius: 18px; overflow: hidden; border: 1px solid #0a3a47; margin-bottom: 2rem; color: #ffffff;">
<div style="background: linear-gradient(110deg, rgba(6,20,26,0.94) 0%, rgba(10,58,71,0.86) 42%, rgba(157,23,93,0.58) 100%); padding: 1.75rem 1.75rem 2rem;">
<div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.4rem;">
<div style="font-family: Georgia, 'Times New Roman', serif; font-size: 0.82rem; font-weight: 700; letter-spacing: 0.14em; color: #ffd9e8;">INGHAM ISD &nbsp;&middot;&nbsp; COSMETOLOGY PATHWAY</div>
<div style="font-family: Georgia, serif; font-size: 0.78rem; letter-spacing: 0.1em; color: #ffe3ee; border: 1px solid rgba(255,209,228,0.55); border-radius: 999px; padding: 0.3rem 0.8rem;">LEVEL II</div>
</div>
<h2 style="font-family: Georgia, 'Times New Roman', serif; margin: 0; font-size: 3rem; line-height: 1.05; color: #ffffff;">Cosmetology II</h2>
<div style="width: 84px; height: 4px; background: linear-gradient(90deg, #ec4899, #f9a8d4); border-radius: 2px; margin: 0.85rem 0 1rem;"></div>
<p style="font-family: Helvetica, Arial, sans-serif; font-size: 1.22rem; line-height: 1.5; margin: 0; max-width: 640px; color: #ffffff;">A returning-student homepage with the same pathway look but a stronger focus on advanced practice, professionalism, and next-step career readiness.</p>
</div>
</div>
<div style="display: flex; flex-wrap: wrap; gap: 0.85rem; margin-bottom: 2rem;">
<a href="/courses/[COURSE_ID]/modules" style="flex: 1 1 200px; min-width: 160px; text-align: center; background: linear-gradient(135deg, #007e8a 0%, #06303a 100%); color: #ffffff; font-family: Helvetica, Arial, sans-serif; font-weight: 700; font-size: 1.25rem; padding: 1.4rem 0.75rem; border-radius: 12px; border-bottom: 5px solid #ec4899; text-decoration: none;">Modules</a>
<a href="/courses/[COURSE_ID]/announcements" style="flex: 1 1 200px; min-width: 160px; text-align: center; background: linear-gradient(135deg, #007e8a 0%, #06303a 100%); color: #ffffff; font-family: Helvetica, Arial, sans-serif; font-weight: 700; font-size: 1.25rem; padding: 1.4rem 0.75rem; border-radius: 12px; border-bottom: 5px solid #ec4899; text-decoration: none;">Announcements</a>
<a href="/courses/[COURSE_ID]/grades" style="flex: 1 1 200px; min-width: 160px; text-align: center; background: linear-gradient(135deg, #007e8a 0%, #06303a 100%); color: #ffffff; font-family: Helvetica, Arial, sans-serif; font-weight: 700; font-size: 1.25rem; padding: 1.4rem 0.75rem; border-radius: 12px; border-bottom: 5px solid #ec4899; text-decoration: none;">My Grades</a>
</div>
<div style="background: linear-gradient(180deg, #ffffff 0%, #f4fbfc 100%); border: 1px solid #d7e1e4; border-top: 5px solid #006a78; border-radius: 14px; padding: 1.6rem; margin-bottom: 1.5rem;">
<h2 style="font-family: Georgia, 'Times New Roman', serif; margin: 0 0 0.6rem; color: #06303a;">Welcome back</h2>
<p style="font-family: Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.6; margin: 0;">This version works well when students already know the basic course flow and need a cleaner, more advanced landing page that emphasizes goals, reminders, and professional habits.</p>
</div>
<div style="background: linear-gradient(115deg, #06303a 0%, #0a3a47 38%, #be185d 100%); color: #ffffff; padding: 1.9rem; border-radius: 16px; text-align: center;">
<h2 style="font-family: Georgia, 'Times New Roman', serif; margin: 0 0 0.5rem; color: #ffffff;">You're building the next level of your craft.</h2>
<p style="font-family: Helvetica, Arial, sans-serif; margin: 0;">Use this page to orient advanced students, reinforce expectations, and send them straight into the current module.</p>
</div>
</div>`,
    { source: "Canvas Reference Files/Top-Level Templates/cos2-homepage.html", tags: ["homepage", "cos", "advanced"], promptHint: "Use this when the teacher wants a returning-student or level-two homepage with stronger advanced-course messaging." }
  ),
  createTemplate(
    "medical-assisting-homepage",
    "Medical Assisting Homepage",
    "Health sciences homepage with quick nav, current focus, and getting-help sections",
    "Homepages",
    `<div class="iisd-page">
<div style="background-color: #0d2235; border-radius: 18px; overflow: hidden; border: 1px solid #15616f; margin-bottom: 2rem; color: #ffffff;">
<div style="background: linear-gradient(135deg, #0e7c8b 0%, #15616f 45%, #001d55 100%); padding: 1.5rem 1.5rem 2rem;">
<div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
<div style="font-size: 0.8rem; font-weight: 700; color: #e5d0b1;">INGHAM ISD &nbsp;&middot;&nbsp; HEALTH SCIENCES PATHWAY</div>
<div style="width: 3.25rem; height: 3.25rem; border-radius: 999px; border: 2px solid rgba(229,208,177,0.6); background-color: rgba(255,255,255,0.10); display: flex; align-items: center; justify-content: center; font-size: 1.7rem; color: #e5d0b1;">+</div>
</div>
<h2 style="font-family: Cambria, serif; margin: 0; font-size: 2.8rem; line-height: 1.08; color: #e5d0b1;">Medical Assisting</h2>
<p style="font-family: Calibri, sans-serif; font-size: 1.25rem; line-height: 1.5; margin: 0.9rem 0 0; color: #ffffff;">Build the clinical, administrative, and professional skills used every day in a real medical office and start toward a career in health care.</p>
</div>
</div>
<div style="display: flex; flex-wrap: wrap; gap: 0.85rem; margin-bottom: 2rem;">
<a href="/courses/[COURSE_ID]/modules" style="flex: 1 1 180px; min-width: 150px; text-align: center; background-color: #15616f; color: #ffffff; font-family: Calibri, sans-serif; font-weight: 700; font-size: 1rem; padding: 1.1rem 0.75rem; border-radius: 10px; text-decoration: none;">Modules</a>
<a href="/courses/[COURSE_ID]/announcements" style="flex: 1 1 180px; min-width: 150px; text-align: center; background-color: #15616f; color: #ffffff; font-family: Calibri, sans-serif; font-weight: 700; font-size: 1rem; padding: 1.1rem 0.75rem; border-radius: 10px; text-decoration: none;">Announcements</a>
<a href="/courses/[COURSE_ID]/grades" style="flex: 1 1 180px; min-width: 150px; text-align: center; background-color: #15616f; color: #ffffff; font-family: Calibri, sans-serif; font-weight: 700; font-size: 1rem; padding: 1.1rem 0.75rem; border-radius: 10px; text-decoration: none;">My Grades</a>
</div>
<div style="display: flex; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 1.5rem;">
<div style="flex: 2 1 360px; background-color: #ffffff; border: 1px solid #d7e1e4; border-radius: 14px; padding: 1.5rem;">
<h2 style="font-family: Cambria, serif; margin: 0 0 0.6rem; color: #15616f;">Welcome to the course</h2>
<p style="color: #1f2937; line-height: 1.6; margin: 0;">Use this homepage for a health-science or medical-assisting course that needs a polished landing page, a weekly focus block, and simple support directions.</p>
</div>
<div style="flex: 1 1 260px; background-color: #e5d0b1; border-radius: 14px; padding: 1.5rem; color: #001d55;">
<h2 style="font-family: Cambria, serif; margin: 0 0 0.75rem; color: #001d55;">Your Instructor</h2>
<p style="margin: 0; line-height: 1.55;"><strong>[Instructor Name]</strong><br /><strong>Email:</strong> <a href="mailto:[email]" style="color: #15616f; text-decoration: underline;">[email]</a></p>
</div>
</div>
<div style="background-color: #f1f7f8; border-left: 6px solid #e59a24; padding: 1.25rem 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
<h2 style="font-family: Cambria, serif; margin: 0 0 0.5rem; color: #15616f;">Right Now in Class</h2>
<ul style="color: #1f2937; line-height: 1.6; margin: 0; padding-left: 1.25rem;">
<li><strong>This week's unit:</strong> [unit name]</li>
<li><strong>Due soon:</strong> [assignment + date]</li>
<li><strong>Bring or prepare:</strong> [supplies, reminders]</li>
</ul>
</div>
</div>`,
    { source: "Canvas Reference Files/Top-Level Templates/course_189_homepage.html", tags: ["homepage", "medical assisting", "health sciences"], promptHint: "Use this for course landing pages that need quick navigation, instructor contact info, and a weekly focus area." }
  ),
  createTemplate(
    "discussion-board-guide",
    "Discussion Board Guide",
    "Full discussion-board explainer with weekly prompt, posting rules, examples, and checklist",
    "Discussion",
    `<div class="iisd-page">
<div style="border-radius: 18px; overflow: hidden; margin-bottom: 1rem; border: 2px solid #f0b352; background-color: #fffaf0;">
<div style="background: linear-gradient(135deg, #7c2d12 0%, #c2410c 45%, #f59e0b 100%); padding: 1.15rem 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
<div><div style="font-size: 0.8rem; letter-spacing: 0.09em; text-transform: uppercase; color: #ffe9c7;">This Week's Prompt</div><h2 style="margin: 0.1rem 0 0; font-size: 1.9rem; line-height: 1.1; color: #ffffff;">Aha! Moment Discussion</h2></div>
</div>
<div style="padding: 1.5rem;">
<p style="color: #1f2937; line-height: 1.6; margin: 0 0 1.1rem;"><strong>Watch the weekly video</strong>, then write your initial post answering every part of the prompt below.</p>
<div style="background: linear-gradient(180deg, #fffdf7 0%, #fff1d6 100%); border: 1px solid #f0b352; border-left: 5px solid #d97706; border-radius: 14px; padding: 1.35rem;">
<h3 style="margin: 0 0 0.6rem; color: #7c2d12; font-size: 1.3rem;">Your Discussion Prompt</h3>
<ol style="color: #431407; line-height: 1.65; margin: 0; padding-left: 1.3rem;">
<li style="margin-bottom: 0.55rem;">Respond to the main reflection question.</li>
<li style="margin-bottom: 0.55rem;">Connect it to class, lab, salon, or workplace practice.</li>
<li style="margin-bottom: 0;">Ask or answer one question that could continue the conversation.</li>
</ol>
</div>
</div>
</div>
<details style="margin-bottom: 1rem;">
<summary style="cursor: pointer; background: linear-gradient(135deg, #0a3a47, #007e8a); color: #ffffff; padding: 0.9rem 1.25rem; border-radius: 12px; font-size: 1.05rem; font-weight: bold;">Open the full guide</summary>
<div style="padding-top: 1.75rem;">
<div style="background: linear-gradient(180deg, #ffffff 0%, #f1f9fb 100%); border: 1px solid #dce7ea; border-top: 5px solid #007e8a; border-radius: 14px; padding: 1.35rem; margin-bottom: 1.25rem;">
<h3 style="margin: 0 0 0.75rem; color: #06303a; font-size: 1.35rem;">Your Weekly Posts</h3>
<ul style="color: #1f2937; padding-left: 1.3rem; margin: 0; line-height: 1.65;">
<li><strong>Initial Post:</strong> Your complete answer to the prompt.</li>
<li><strong>Reply to Peer 1:</strong> A specific, professional response.</li>
<li><strong>Reply to Peer 2:</strong> A second specific, professional response.</li>
</ul>
</div>
<div style="background-color: #fff8e6; border: 1px solid #fde2a7; border-left: 5px solid #d97706; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.25rem;">
<strong style="color: #7c2d12;">Deadline:</strong> Post your <strong>initial post by Tuesday at the end of class</strong>.
</div>
<div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-left: 5px solid #059669; border-radius: 14px; padding: 1.1rem 1.25rem; margin-bottom: 1.25rem;">
<strong style="color: #065f46;">Professional reply example</strong>
<p style="color: #064e3b; margin: 0.4rem 0 0;">Point to one specific idea from a classmate's post, explain why it matters, and ask a real follow-up question.</p>
</div>
<div style="background: linear-gradient(135deg, #06141a 0%, #0a3a47 60%, #007e8a 100%); border-radius: 16px; padding: 1.5rem; color: #ffffff; border: 1px solid #0d3340; border-top: 4px solid #5ec6d6;">
<h3 style="margin: 0 0 0.75rem; color: #aee6ef; font-size: 1.35rem;">Quick Checklist Before You Post</h3>
<ul style="list-style: none; padding: 0; margin: 0; color: #e6f6f9; line-height: 1.7;">
<li>Did I answer all parts of the prompt?</li>
<li>Did I use professional vocabulary?</li>
<li>Did I spell-check and remove text slang?</li>
<li>Are my replies helpful, polite, and professional?</li>
</ul>
</div>
</div>
</details>
</div>`,
    { source: "Canvas Reference Files/Top-Level Templates/discussion-guide-template-cos182.html", tags: ["discussion", "prompt", "replies"], promptHint: "Use this when the teacher wants a complete discussion-board page, not just the prompt itself." }
  ),
  createTemplate(
    "discussion-prompt-card",
    "Discussion Prompt Card",
    "Compact discussion-board starter with prompt, requirements, and reply expectations",
    "Discussion",
    `<div style="background: linear-gradient(180deg, #fffdf7 0%, #fff4dc 100%); border: 1px solid #f0b352; border-top: 6px solid #d97706; border-radius: 16px; padding: 1.5rem; font-family: Lato, Arial, sans-serif;">
<div style="display: inline-block; background-color: #7c2d12; color: #ffffff; border-radius: 999px; padding: 0.35rem 0.8rem; font-size: 0.82rem; margin-bottom: 0.85rem;">Discussion Board</div>
<h2 style="margin: 0 0 0.5rem; color: #7c2d12; font-size: 1.9rem;">Weekly Discussion Prompt</h2>
<p style="color: #431407; line-height: 1.6; margin: 0 0 1rem;">Use this lighter-weight template when you want students to see the prompt and requirements immediately without a full guide page.</p>
<div style="background-color: #ffffff; border: 1px solid #f3d39a; border-radius: 12px; padding: 1.15rem; margin-bottom: 1rem;">
<h3 style="margin: 0 0 0.6rem; color: #7c2d12;">Prompt</h3>
<ol style="color: #431407; line-height: 1.65; margin: 0; padding-left: 1.3rem;">
<li>[Main response question]</li>
<li>[Connection to reading, video, or lab]</li>
<li>[Extension or reflection question]</li>
</ol>
</div>
<div style="display: flex; flex-wrap: wrap; gap: 1rem;">
<div style="flex: 1 1 220px; background-color: #fff8e6; border-left: 5px solid #d97706; border-radius: 10px; padding: 1rem;">
<strong style="color: #7c2d12;">Required Posts</strong>
<p style="margin: 0.4rem 0 0; color: #431407;">1 initial post and 2 peer replies.</p>
</div>
<div style="flex: 1 1 220px; background-color: #ecfdf5; border-left: 5px solid #059669; border-radius: 10px; padding: 1rem;">
<strong style="color: #065f46;">Reply Expectation</strong>
<p style="margin: 0.4rem 0 0; color: #064e3b;">Be specific, supportive, and add something new to the conversation.</p>
</div>
</div>
</div>`,
    { source: "Derived from discussion-guide-template-cos182", tags: ["discussion", "compact", "prompt"], promptHint: "Use this when the teacher wants a cleaner, faster discussion prompt layout without the full instruction guide." }
  ),
  createTemplate(
    "auto-course-home",
    "Auto Course Home",
    "Automotive course homepage derived from bay-briefing and pathway-style course landing pages",
    "Homepages",
    `<div style="font-family: Lato, Arial, sans-serif; color: #e5eef2;">
<div style="background: linear-gradient(135deg, #0a1f2c 0%, #12394b 50%, #1e5a6a 100%); border-radius: 18px; padding: 1.6rem; margin-bottom: 1.5rem; border: 1px solid #23495a;">
<div style="display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
<div style="font-size: 0.82rem; letter-spacing: 0.1em; color: #9ed7e3;">AUTOMOTIVE TECHNOLOGY</div>
<div style="font-size: 0.82rem; color: #d8edf2; border: 1px solid rgba(216,237,242,0.35); border-radius: 999px; padding: 0.25rem 0.75rem;">SHOP FLOOR READY</div>
</div>
<h2 style="margin: 0; font-size: 2.7rem; line-height: 1.08; color: #ffffff;">Auto Shop Home</h2>
<p style="margin: 0.85rem 0 0; font-size: 1.08rem; line-height: 1.55; max-width: 720px; color: #d8edf2;">Use this as a course landing page for automotive pathways. It blends the bay briefing structure with a more navigational homepage layout.</p>
</div>
<div style="display: flex; flex-wrap: wrap; gap: 0.85rem; margin-bottom: 1.5rem;">
<a href="/courses/[COURSE_ID]/modules" style="flex: 1 1 190px; min-width: 150px; text-align: center; background-color: #005e75; color: #ffffff; font-weight: 700; padding: 1rem 0.75rem; border-radius: 12px; text-decoration: none;">Modules</a>
<a href="/courses/[COURSE_ID]/announcements" style="flex: 1 1 190px; min-width: 150px; text-align: center; background-color: #005e75; color: #ffffff; font-weight: 700; padding: 1rem 0.75rem; border-radius: 12px; text-decoration: none;">Announcements</a>
<a href="/courses/[COURSE_ID]/grades" style="flex: 1 1 190px; min-width: 150px; text-align: center; background-color: #005e75; color: #ffffff; font-weight: 700; padding: 1rem 0.75rem; border-radius: 12px; text-decoration: none;">My Grades</a>
</div>
<div style="display: flex; flex-wrap: wrap; gap: 1.25rem; margin-bottom: 1.5rem;">
<div style="flex: 2 1 340px; background-color: #f7fbfc; color: #1f2937; border-radius: 14px; padding: 1.35rem; border-top: 5px solid #005e75;">
<h3 style="margin: 0 0 0.5rem; color: #003b49;">Welcome to the shop</h3>
<p style="margin: 0 0 0.75rem; line-height: 1.6;">Students use this page to find the current module, shop expectations, bay rotation focus, and safety reminders.</p>
<ul style="margin: 0; padding-left: 1.25rem; line-height: 1.6;">
<li>Check the current module first</li>
<li>Review bay or system focus for the week</li>
<li>Prepare tools, PPE, and documentation before lab begins</li>
</ul>
</div>
<div style="flex: 1 1 260px; background-color: #eef7f8; color: #1f2937; border-radius: 14px; padding: 1.35rem; border-top: 5px solid #768336;">
<h3 style="margin: 0 0 0.5rem; color: #003b49;">This Week in the Shop</h3>
<p style="margin: 0; line-height: 1.6;"><strong>Bay or system:</strong> [engine / brakes / electrical / suspension]<br /><strong>Checkoff:</strong> [skill or assessment]<br /><strong>Reminder:</strong> [safety, notebook, or cleanup expectation]</p>
</div>
</div>
<div style="background-color: #ffffff; color: #1f2937; border-radius: 14px; padding: 1.35rem; border: 1px solid #d6d6d6;">
<h3 style="margin: 0 0 0.5rem; color: #005e75;">Career Skills Focus</h3>
<p style="margin: 0; line-height: 1.6;">Use this section for professionalism, employability, documentation, and workplace communication expectations that support the technical lab work.</p>
</div>
</div>`,
    { source: "Derived from Bay briefing auto and course-homepage patterns", tags: ["automotive", "homepage", "shop"], promptHint: "Use this for an automotive landing page when the teacher wants a real homepage rather than a single bay briefing." }
  )
];
