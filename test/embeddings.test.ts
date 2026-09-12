/**
 * @file embeddings.test.ts
 * @description Unit tests for vector cosine similarity mathematics and edge cases.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { computeCosineSimilarity } from '../packages/sdk/src/core/embeddingsMath.ts';

describe('useEmbeddings: Cosine Similarity Mathematics', () => {
  test('Identical vectors produce a cosine similarity of exactly 1.0', () => {
    const vecA = [0.5, 0.5, 0.5, 0.5];
    const vecB = [0.5, 0.5, 0.5, 0.5];
    const score = computeCosineSimilarity(vecA, vecB);
    assert.equal(score, 1.0);
  });

  test('Orthogonal vectors produce a cosine similarity of 0.0', () => {
    const vecA = [1.0, 0.0, 0.0];
    const vecB = [0.0, 1.0, 0.0];
    const score = computeCosineSimilarity(vecA, vecB);
    assert.equal(score, 0.0);
  });

  test('Opposite vectors produce a cosine similarity of -1.0', () => {
    const vecA = [1.0, 0.0];
    const vecB = [-1.0, 0.0];
    const score = computeCosineSimilarity(vecA, vecB);
    assert.equal(score, -1.0);
  });

  test('Mismatched vector lengths or empty vectors return 0', () => {
    assert.equal(computeCosineSimilarity([], []), 0);
    assert.equal(computeCosineSimilarity([1, 2], [1, 2, 3]), 0);
  });
});
