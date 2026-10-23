export const examples = {
  release: `diff --git a/.github/workflows/deploy.yml b/.github/workflows/deploy.yml
--- a/.github/workflows/deploy.yml
+++ b/.github/workflows/deploy.yml
@@ -1,5 +1,6 @@
 name: Deploy
 on:
-  push:
+  pull_request_target:
+permissions: write-all
 jobs:
   deploy:
diff --git a/src/db/migrate.sql b/src/db/migrate.sql
new file mode 100644
--- /dev/null
+++ b/src/db/migrate.sql
@@ -0,0 +1,2 @@
+DROP TABLE legacy_sessions;
+CREATE TABLE sessions (id integer primary key);
diff --git a/tests/session.test.js b/tests/session.test.js
deleted file mode 100644
--- a/tests/session.test.js
+++ /dev/null
@@ -1,3 +0,0 @@
-import { test } from 'node:test';
-test('session expires after logout', () => {
-});
diff --git a/package.json b/package.json
--- a/package.json
+++ b/package.json
@@ -1,3 +1,3 @@
 {
-  "dependency": "1.0.0"
+  "dependency": "2.0.0"
 }`,
  tests: `diff --git a/src/session.js b/src/session.js
--- a/src/session.js
+++ b/src/session.js
@@ -1,3 +1,3 @@
 export function expired(session, now) {
-  return session.expiresAt < now;
+  return session.expiresAt <= now;
 }
diff --git a/tests/session.test.js b/tests/session.test.js
--- a/tests/session.test.js
+++ b/tests/session.test.js
@@ -1,2 +1,2 @@
-test('expires at boundary', () => {
+test.skip('expires at boundary', () => {
 });`,
  small: `diff --git a/README.md b/README.md
--- a/README.md
+++ b/README.md
@@ -1,3 +1,4 @@
 # Example project
 
-Run the tests before sending a patch.
+Run node --test before sending a patch.
+Keep each pull request focused on one change.`,
};
