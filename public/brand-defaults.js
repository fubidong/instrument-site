(function() {
  function fillBrandDefaults(sel) {
    try {
      var brands = JSON.parse(sel.dataset.brands || "{}");
      var code = sel.value;
      var desc = brands[code] || { zh: "", en: "" };
      var form = sel.closest("form");
      if (!form) return;
      var zhInput = form.querySelector('[name="tagline_zh"]');
      var enInput = form.querySelector('[name="tagline_en"]');
      if (zhInput) zhInput.value = (desc.zh || "").slice(0, 100);
      if (enInput) enInput.value = (desc.en || "").slice(0, 100);
    } catch (e) { console.error(e); }
  }
  window.fillBrandDefaults = fillBrandDefaults;
  document.addEventListener("DOMContentLoaded", function() {
    var sel = document.querySelector('select[name="brandCode"]');
    if (sel) fillBrandDefaults(sel);
  });
})();
