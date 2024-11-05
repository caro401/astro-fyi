import { AstroError } from "astro/errors";
import { z } from "astro/zod";

export type SitemapConfig = z.infer<typeof globalSitemapConfigSchema>;

const sitemapEntrySchema = z.object({
  /**
   * Whether the page is external (i.e. not part of the website)
   * @remarks Used for links to other websites
   */
  external: z.boolean(),
  /**
   * Whether the page exists
   * @remarks Used for unresolved pages
   */
  exists: z.boolean(),
  /**
   * The title of the page
   */
  title: z.string(),
  /**
   * The links going out from the page
   *
   * @optional
   */
  links: z.array(z.string()).optional(),
  /**
   * The backlinks going into the page
   *
   * @optional
   */
  backlinks: z.array(z.string()).optional(),
  /**
   * The tags associated with the page
   *
   * @optional
   */
  tags: z.array(z.string()).optional(),
});

export type SitemapEntry = z.infer<typeof sitemapEntrySchema>;

const sitemapSchema = z.record(z.string(), sitemapEntrySchema);

export type Sitemap = z.infer<typeof sitemapSchema>;

const globalBacklinksConfigSchema = z.object({
  /**
   * Configure the visibility of the backlinks component in the sidebar with an ordered list of rules.
   * The backlinks are hidden/shown if the page's _slug_ matches one of the rules.
   * When a rule starts with `!`, the backlinks are _hidden_ if matched.
   * Rules are evaluated in order, the first matching rule determines the visibility of the page.
   * If visibility of the backlinks was specified in the page frontmatter, it will take precedence over these rules.
   *
   * @default Backlinks are visible for all pages
   * ["**\/*"]
   * @example Only show backlinks for pages in the "api" folder:
   * ["api/**"]
   * @example Show backlinks for all pages except those in the "secret" folder:
   * ["!secret/**", "**\/*"]
   * @see https://github.com/mrmlnc/fast-glob#basic-syntax
   */
  visibilityRules: z.array(z.string()).default(["**/*"]),
});

const globalSitemapConfigSchema = z.object({
  /**
   * The root directory of the content used to generate links from for the sitemap
   *
   * @default "./src/content/docs"
   */
  contentRoot: z.string().default("./src/content/docs"),

  /**
   * Include links going to external websites in the sitemap
   *
   * @default false
   */
  includeExternalLinks: z.boolean().default(false),

  /**
   * Specify a custom sitemap to be used for the PageSidebar graph component.
   * If unspecified, a sitemap will be generated from the content directory (see `contentRoot`), using the `pageInclusionRules` and `linkInclusionRules`.
   *
   * @default undefined
   */
  sitemap: sitemapSchema.optional(),

  /**
   * Title of nodes for specific nodes of the graph (including external nodes). \
   * **Overrides** the title of the page specified in the frontmatter, but
   *   can be **overridden** by the `sitemap.pageTitle` frontmatter field. \
   * The specified link should match the full path of the page or external link.
   *
   * @example The node with endpoint "BASEPATH/intro" should be called "Main" (instead of its frontmatter title "Introduction")
   * { "BASEPATH/intro": "Main" }
   */
  pageTitles: z.record(z.string(), z.string()).default({}),

  /**
   * Ignore links produced by Starlight which exist on every page.
   * Specifically, these are:
   *   - `/`: The root link, which exists within the title
   *   - `social`: Any social link
   *   - `edit`: The link for editing the current page
   *   - `credits`: The "Starlight Attribution" link
   *   - Pagination links
   *
   * All links of the sidebar are _always_ ignored.
   * These ignore rules will be added to the `pageInclusionRules` setting (inserted _before_ the last rule).
   *
   * @default true
   */
  ignoreStarlightLinks: z.boolean().default(true),
  /**
   * Determine the inclusion of files in the sitemap based on provided ordered list of rules.
   * The page is included/excluded if the file's _path_ matches one of the rules.
   * When a rule starts with `!`, the file is _excluded_ if matched.
   * Rules are evaluated in order, the first matching rule determines the inclusion of the file.
   * If sitemap inclusion was specified in the page frontmatter, it will take precedence over these rules.
   *
   * @default Sitemap includes all files by default
   * ["**\/*"]
   * @example Only include files in the "api" folder:
   * ["api/**", "!**\/*"]
   * @example Include all files except those in the "secret" folder:
   * ["!secret/**", "**\/*"]
   */
  pageInclusionRules: z.array(z.string()).default(["**/*"]),

  /**
   * Determine which links are included in the sitemap for every page.
   * The link is included/excluded if the link's target _path_ matches one of the rules.
   * When a rule starts with `!`, the link is _excluded_ if matched.
   * Rules are evaluated in order, the first matching rule determines the inclusion of the link.
   * Link rules specified in the page frontmatter take precedence over these rules.
   *
   * @default Sitemap includes all links by default
   * ["**\/*"]
   * @example Only include links to endpoints in the "api" subdirectory:
   * ["api/**"]
   * @example Include all links except those to the "secret" subdirectory:
   * ["!secret/**", "**\/*"]
   * @example Remove external links to GitHub for "Edit page":
   * ["!https://**\/edit/**", "**\/*"]
   */
  linkInclusionRules: z.array(z.string()).default(["**/*"]),

  /**
   * Determine which pages should be associated with specific tags based on provided ordered list of rules. \
   * A tag is added to the page if the file's _path_ matches one of the rules. \
   * When a rule starts with `!`, if matched, it will _remove_ the tag from the page _(not from the file!)_, if it exists. \
   * Rules are evaluated in order, the first matching rule determines whether the tag is added. \
   * Tags generated from the rules will be combined with tags specified in the page frontmatter.
   *
   * @default {}
   * @example Add the "api" tag to all pages in the "api" folder:
   * { "api": ["api/**"] }
   * @example Add the "secret" tag to all pages except those in the "public" folder, will remove existing "secret" tags in the "public" folder:
   * { "secret": ["!public/**", "**\/*"] }
   */
  tagRules: z.record(z.string(), z.array(z.string())).default({}),
});

export const starlightSiteGraphConfigSchema = z
  .object({
    /**
     * Configuration for the sitemap generation.
     *
     * @default ```{
     *    contentRoot: './src/content/docs',
     *    includeExternalLinks: false,
     *    pageInclusionRules: ["**\/*"],
     *    linkInclusionRules: ["**\/*"],
     * }```
     */
    sitemapConfig: globalSitemapConfigSchema.default({}),

    /**
     * Configuration for the PageSidebar backlinks component.
     *
     * @default ```{
     *   visibilityRules: ["**\/*"],
     * }```
     */
    backlinksConfig: globalBacklinksConfigSchema.default({}),
  })
  .default({});

export type StarlightSiteGraphConfig = z.infer<
  typeof starlightSiteGraphConfigSchema
>;

export function validateConfig(userConfig: unknown): StarlightSiteGraphConfig {
  const config = starlightSiteGraphConfigSchema.safeParse(userConfig);

  if (!config.success) {
    const errors = config.error.flatten();
    throw new AstroError(
      `Invalid starlight-site-graph configuration:

            ${errors.formErrors.map((formError) => ` - ${formError}`).join("\n")}
            ${Object.entries(errors.fieldErrors)
              .map(
                ([fieldName, fieldErrors]) =>
                  `- ${fieldName}: ${JSON.stringify(fieldErrors)}`,
              )
              .join("\n")}
            `,
    );
  }

  return config.data;
}