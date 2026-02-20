#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const importerCode = fs.readFileSync(__dirname + '/../js/edittf-import.js', 'utf8');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(importerCode, sandbox);
const Importer = sandbox.EditTfImporter;

const JUDGE_DREDD_URL = 'http://edit.tf/#8:J_2X8prYb__9pjfkcH7___7-b1cjLOCuD4R39Siv_0LbSmsnr-6mpT-y___Ccj4__3_d4nLcPn9OR8Fc30jv6lNf_oW2lCZPe0_lNfXynI4P3_-9ToS3h3_fkcH72zK5vpHe0Kb_7QttLk1X3U1KbyKDx___05bx03__74j43_v_9kVzbSKEp01_-hcp1J62m9IR8Z__9OWwfv__67bkfyn_____voqhLeCirpr_9Sn9oTfkfD7D-foS3h3______6RVfdf____pyngs7-lFXTX_Kf35HR-ZqP6ct4_9t_bf_____Ujra____-U3f-pZ19KKmm8p_L8CKv_0V7OBZX_-u_vv____-pHe6___7Up__9Szv6UVMin8uraoCKNf-9_3hb___f-3_-vRkUXX____ymr__6lmX0orKfy_5OW1_OBFWnLfv____Xoy_B4xI62X___alOv__1LMvpQo_W_PzUtvf__nz___r0ZdAwXf_qVAR-____-U1Ov__6Wd_S-j6U3_yyr_99_16MuwQMFX_60ToEBHU1___7UprZf__0syL7_6cp_6ltb9GX4fE7vB_aK__9Ag0MCP3V___2hRX8d_fqAu_V_Sn__0YF1H9ehRaH6__xZ72upo_I6mn____9OBRGvXoSnz78_f369evSF1HR4nYdFX_-y9tN7VqR-6v_______nz58L_Pnz58-f___6XVI2GRTg4It_1lvZdfpHU3___7P9__9_-8v___________7Uv4-fFyfntYK__77__tSP3V______u4yay_____________y-nop_L-6Nf0VdFf__8IqunPmrX_3f1N6L________169evSl9_VX94IUCLbya_3_pCgIo0a9b8__v_8j8-fPnz58_f___6X1O_vBGhQMECNAiQJECBBwefODAijRryP_____________7Qu3Vf_rRoiWrECBAgQJHi_QnKePydAwI______________9S7VBk5_VWBOjRoECBR8eJynj-_QYP6cj_________v169evL7UCBAhQIMHBgg4PkpTh8Xp0CDh_w_i_z58-fPnz58____9gi28OHhYuRoMqApg8f06BAg4f16fn_L_________________zhw4cOHz6XRNCj7ylQIEC5OweJ0aA';

function countMosaicCells(charGrid) {
  let total = 0;
  for (let r = 0; r < 25; r++) {
    let graphicsMode = false;
    for (let c = 0; c < 40; c++) {
      const cc = charGrid[r][c];
      if (cc >= 0 && cc <= 7) {
        graphicsMode = false;
      } else if (cc >= 16 && cc <= 23) {
        graphicsMode = true;
      } else if (graphicsMode && Importer.isMosaicChar(cc)) {
        const sixels = Importer.charToSixels(cc);
        if (sixels.some(Boolean)) total++;
      }
    }
  }
  return total;
}

function assertDecodes(label, url, expectedLength, expectedCells) {
  const hashData = Importer.parseUrl(url);
  assert.ok(hashData, label + ': parseUrl should return hash data');
  assert.strictEqual(hashData.length, expectedLength, label + ': unexpected hash length');
  const grid = Importer.decodeHash(hashData);
  const cells = countMosaicCells(grid);
  assert.strictEqual(cells, expectedCells, label + ': unexpected mosaic cell count');
}

assertDecodes('clean', JUDGE_DREDD_URL, 1167, 809);

const wrappedUrl = JUDGE_DREDD_URL.replace(/(.{120})/g, '$1\n  ');
assertDecodes('wrapped with whitespace', wrappedUrl, 1167, 809);

const encodedUrl = JUDGE_DREDD_URL.replace('#8:', '#8:%0A%20%20');
assertDecodes('percent-escaped hash prefix', encodedUrl, 1167, 809);

console.log('PASS: edit.tf importer normalization regression checks');
