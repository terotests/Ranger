import { beforeAll, describe, expect, it } from "vitest";
import {
  ensureCannonCompiled,
  expectCannonPass,
  runCannonAll,
  runCannonTest,
} from "./helpers/cannon-test";

function cannonIt(testId: string) {
  it(testId, () => {
    const output = runCannonTest(testId);
    expectCannonPass(testId, output);
    expect(output).toContain("SINGLE=PASS");
  });
}

describe("Cannon.js Ranger port", () => {
  beforeAll(() => {
    ensureCannonCompiled();
  });

  describe("Vec3", () => {
    cannonIt("Vec3.creation");
    cannonIt("Vec3.cross");
    cannonIt("Vec3.dot");
    cannonIt("Vec3.set");
    cannonIt("Vec3.vadd");
    cannonIt("Vec3.isAntiparallelTo");
    cannonIt("Vec3.almostEquals");
  });

  describe("Quaternion", () => {
    cannonIt("Quaternion.creation");
    cannonIt("Quaternion.conjugate");
    cannonIt("Quaternion.inverse");
    cannonIt("Quaternion.setFromAxisAngle");
    cannonIt("Quaternion.setFromVectors");
    cannonIt("Quaternion.slerp");
  });

  describe("Sphere", () => {
    cannonIt("Sphere.throwOnWrongRadius");
  });

  describe("Box", () => {
    cannonIt("Box.forEachWorldCorner");
    cannonIt("Box.calculateWorldAABB");
  });

  describe("Body", () => {
    cannonIt("Body.computeAABB.box");
    cannonIt("Body.computeAABB.boxOffset");
    cannonIt("Body.pointToLocalFrame");
    cannonIt("Body.pointToWorldFrame");
    cannonIt("Body.applyForce");
    cannonIt("Body.applyImpulse");
    cannonIt("Body.applyLocalForce");
  });

  describe("World", () => {
    cannonIt("World.clearForces");
    cannonIt("World.gravityStep");
    cannonIt("World.collisionMatrix");
    cannonIt("World.sphereBounce");
    cannonIt("World.contactRest");
    cannonIt("World.friction");
  });

  describe("Narrowphase", () => {
    cannonIt("Narrowphase.sphereSphere");
  });

  describe("AABB", () => {
    cannonIt("AABB.construct");
    cannonIt("AABB.copy");
    cannonIt("AABB.clone");
    cannonIt("AABB.extend");
    cannonIt("AABB.overlaps");
    cannonIt("AABB.contains");
    cannonIt("AABB.toLocalFrame");
    cannonIt("AABB.toWorldFrame");
  });

  describe("Mat3", () => {
    cannonIt("Mat3.creation");
    cannonIt("Mat3.elementWrite");
    cannonIt("Mat3.identity");
    cannonIt("Mat3.vmult");
    cannonIt("Mat3.mmult");
    cannonIt("Mat3.linearSolve");
    cannonIt("Mat3.invert");
    cannonIt("Mat3.transposeMatrix");
    cannonIt("Mat3.scaleMatrix");
    cannonIt("Mat3.setRotationFromQuaternion");
  });

  describe("TupleDictionary", () => {
    cannonIt("TupleDictionary.set");
    cannonIt("TupleDictionary.get");
    cannonIt("TupleDictionary.reset");
  });

  describe("OverlapKeeper", () => {
    cannonIt("OverlapKeeper.construct");
    cannonIt("OverlapKeeper.set");
    cannonIt("OverlapKeeper.getDiff");
  });

  describe("ContactEquation", () => {
    cannonIt("ContactEquation.construct");
    cannonIt("ContactEquation.getImpactVelocityAlongNormal");
  });

  describe("Narrowphase", () => {
    cannonIt("Narrowphase.sphereSphere");
  });

  describe("Solver (SPOOK)", () => {
    cannonIt("Jacobian.multiplyVectors");
    cannonIt("Equation.spookParams");
    cannonIt("GSSolver.contact");
    cannonIt("GSSolver.friction");
  });

  describe("Constraints", () => {
    cannonIt("Constraint.pointToPointPendulum");
    cannonIt("Constraint.hingeAxis");
    cannonIt("Constraint.hingeMotor");
  });

  it("runs full Cannon suite aggregate", () => {
    const output = runCannonAll();
    expect(output).toContain("pass=64");
    expect(output).toContain("fail=0");
    expect(output).toContain("cannon-tests done");
  });
});
