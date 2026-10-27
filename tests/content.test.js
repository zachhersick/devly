// Checks every bundled problem and card file. The app loads them with
// import.meta.glob; here they're imported straight from disk.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { validateContent } from "../src/lib/model.js";

const dir = join(import.meta.dirname, "..", "src", "content");
const load = (sub) =>
  Promise.all(
    readdirSync(join(dir, sub))
      .filter((name) => name.endsWith(".js"))
      .sort()
      .map(async (name) => ({ name, value: (await import(pathToFileURL(join(dir, sub, name)).href)).default }))
  );

const problems = await load("problems");
const cards = (await load("cards")).flatMap((file) => file.value);

test("every problem and card is well formed", () => {
  assert.deepEqual(validateContent(problems.map((file) => file.value), cards), []);
});

test("problem files are numbered and named after their id", () => {
  for (const { name, value } of problems) assert.match(name, new RegExp(`^\\d{2}-${value.id}\\.js$`));
});

// Nodes are drawn 96×46 (NODE in diagram-view.tsx) with labels up to 14 characters.
test("diagram nodes fit the canvas without overlapping", () => {
  for (const { value } of problems) {
    const nodes = value.diagram.nodes;
    for (const node of nodes) {
      assert.ok(node.x >= 50 && node.x <= 310 && node.y >= 30 && node.y <= 450, `${value.id}/${node.id} too close to the edge`);
      assert.ok(node.label.length <= 14, `${value.id}/${node.id} label longer than 14 characters`);
    }
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const apart = Math.abs(nodes[i].x - nodes[j].x) >= 104 || Math.abs(nodes[i].y - nodes[j].y) >= 62;
        assert.ok(apart, `${value.id}: ${nodes[i].id} and ${nodes[j].id} overlap`);
      }
    for (const edge of value.diagram.edges) assert.ok(!edge.label || edge.label.length <= 10, `${value.id}: edge label "${edge.label}" longer than 10 characters`);
  }
});
