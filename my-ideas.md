Here you have my ideas: 
I want to revamp this app, but I have a few challenges:
- The NPS data is stored in a Kusto cluster which requires access to the VPN and have a few
special permissions, we have a rough report so I use it to download the data from there in CSV
format.
- The analysis performed by the app is not "intelligent", it uses a set of hardcoded "rules"
that I have been updating as I need it.
- The "categories" are also hardcoded, which I created on my own convenience.
- The NPS feedback for the MSSQL extension for VS Code is poluted with noise coming from users
unhappy about the ADS retirement often making comparisons with this tool or SSMS.
- All these rules, categories, and filters are hardcoded

More context:
Here is a screenshot of this app [Image #1], NPS analysis tool that transforms raw survey
responses into structured, actionable insights for product decisions. It automatically
calculates NPS (promoters, passives, detractors) and uses rule-based text analysis to classify
comments into key categories (e.g., missing features, performance, UI/UX, ADS/SSMS comparisons,
connectivity, Copilot), detect the affected product area (query editor, results, object
explorer, etc.), and infer user type (developer, DBA, analyst). It also includes search,
filtering, and CSV export to explore feedback interactively. The goal is to quickly understand
why the NPS score is what it is, identify the main drivers of dissatisfaction or praise, and
prioritize improvements based on real user sentiment rather than manually reviewing hundreds of
comments.

If you need more context use the @CLAUDE.md we created using the "init" slash command.


Here is my what I would like to do:
1. I want to use OpenSpec (already installed), to revamp this app with my new set of
requirements.
2. I want to make sure we follow a spec-driven development practice here so I can share this
with other PMs and make it a "modular" tool for my team.-Do no include this, this is only for
you
3. I want to take a step back on the approach, right now the user has to put the CSV file into
the "public" folder and then the tool will analyze the data when it starts. Instead, what I want
 is to have a "load data" screen where the user will provide the data source. Then, after
providing the file the tool should make sure the file is not corrupt, it has good data, etc,
like a quick validation. If the data is valid, then the tool should create the structure for the
 report.
4. In order to analyze the data, and come up with a flexible report structure I'm thinking about
 having an AI agent that takes care of that part. Validating the structure, the data and then
coming up with a structure.
5. After the structure is created, the app (probably another agent) should move into creating
the multiple "themes" or categories. This is crucial to the analysis, having those categories
helps PMs to pin point multiple issues. As you can see the app right now has categories as
"Missing features", "Quality/Performance", etc. Those categories are created after applying the
rules. In other words, once the app reads the data it adds a category to each data point based
on the content of the CSV.
6. Probably the "report structure" (columns) and the "categories" should receive an
input/confirmation from the user. Imagine that the CSV file includes a column like "OS version".
 That information probably is not very helpful, so the user should be able to "remove" that
column. The same goes for "categories" maybe a category proposed makes no sense; so the user
should be able to see why such category is been proposed (showing a data point) and be able to
propose a different "theme" or have that category removed. When there is no good classification,
 the "General feedback" category should be used.
7. You see that at the top of the UI it says "MSSQL VS Code - NPS Analysis Tool". This needs to
change as now the tool will be "generic". So the user should provide the information at the
beginning to let the app know what is the tool in the scope of the analysis.
8. I'm thinking that perhaps it will be a good idea to have a screen to create a "new project",
where the user will provide the details as the "Tool name", "Small description", then provide
the data source, all those things required for the app. Then, after completing the project
creation, the user will be moved to the "data validation" process, followed by the "report
structure" creation, followed by the categories.
9. Once the report structure is created, a dashboard with the NPS score should be shown. As you
can see from the existing app, all the NPS related cards "Total resposes" "Promoters" etc
applies filters to the data. Of course the filters also apply filters and there is an option to
search.
10. My report includes this "version" dropdown that allows me to switch back and forth between
multiple version of the tool. Sometimes the NPS data (CSV) spans multiple versions, this
functionality should be better perhaps moved to be a filter or something else.
11. You also see that there is a "ADS/SSMS" button, that is special because in my case we
receive too much noise from users comparing our tool with those two ugly things. I want to
introduce a "configuration console" or something like that where the users can apply "noise
reduction" or "Polution" I don't know something like where the user will say "Hey I would like to make sure that any comment related to "ADS/SSMS" can be filtered out from the NPS score. As I don't want those comments to impact my NPS score".
12. There will be instances where the feedback is not constructive, or the same makes no sense. I want to make sure the Agent is capable to identify those occurrences and flag them as "Non-Actionable".
13. There will be instances where there will be no comment, so it needs to be flagged as I have it today.
14. There is a "Download filtered CSV", I want to include that capability. I also thinking that users should be able to "export" the project metadata. Remember the tool they are using, the modifications they made to the categories, filters, excluding comments, etc. 
15. I'm thinking that it migth be worth having a small database like SQLlite to save projects. Say I'm a user which comes here every week, I don't want to start over from the scratch so maybe they have a save configuration (metadata) then want to reuse, they can load that to get started with the project. Obviously they have to provide the data. 
16. I guess we also need a database because of the agent, this might a RAG so in case you need a better database than SQlite use SQL Server 2025 or Azure SQL database for teh backend (prefered).
17. The report should provide me a "summary", something like a MD file that includes just a high-level summary of the report, providing insights of what should be addressed (also use the AI agent for this).
I might want to have users, so try to use any existing authentication model that reuses existing accounts of the user like GitHub (priority), Google, or email/password.
For the ADR doc, I'm thinking that this is basically a SaaS. So I will need the Cloud, I want to create a local version first so provide me with a strong stack recommendation. I want something modern, so perhaps Next.JS, with React, with Node. For the database layer, I want to manage my schema using an ORM but not sure if Prisma or Drizzle is compatible with vector data types in SQL Server. 
As I mentioned, I want to make this project a spec-driven app, so I need you to create the plan to work with OpenSpec on this. Probably you provide me with the commands to use and the content I should use to pass the PRD/spec content.
