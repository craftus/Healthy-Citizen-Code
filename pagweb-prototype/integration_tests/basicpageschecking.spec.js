// Generated by Selenium IDE
const { Builder, By, Key, until } = require('selenium-webdriver')
const assert = require('assert')

describe('Basic pages checking', function() {
  this.timeout(30000)
  let driver
  let vars
  beforeEach(async function() {
    driver = await new Builder().forBrowser('firefox').build()
    vars = {}
  })
  afterEach(async function() {
    await driver.quit();
  })
  it('Login with valid credentials', async function() {
    await driver.get("https://pagweb:pagwebpass@pagweb-prototype.conceptant.com//login")
    await driver.manage().window().setRect(1552, 840)
    await driver.wait(until.elementLocated(By.xpath("//form-header[@class=\'ng-scope\']")), 150000)
    await driver.findElement(By.id("login")).sendKeys("test2")
    await driver.findElement(By.id("password")).sendKeys("Test123!")
    await driver.findElement(By.css("div:nth-child(3) > .ng-scope")).click()
    await driver.findElement(By.css(".btn")).click()
    await driver.wait(until.elementLocated(By.xpath("//span[@id=\'logo\']")), 150000)
    assert(await driver.getTitle() == "My Profile | PAG Simulated Portal")
  })
  it('Adverse Events', async function() {
    await driver.get("https://pagweb:pagwebpass@pagweb-prototype.conceptant.com//adverseEvents")
    await driver.manage().window().setRect(1552, 840)
    assert(await driver.getTitle() == "drugInteractions | PAG Simulated Portal")
    await driver.switchTo().frame(0)
    assert(await driver.findElement(By.css(".content-box > .content-title:nth-child(1)")).getText() == "Potential Adverse Events For My Current Medications")
    assert(await driver.findElement(By.css(".content-title:nth-child(2)")).getText() == "The data presented here is for informational purposes only. Please discuss this information with your healthcare practitioner(s) ")
    {
      const elements = await driver.findElements(By.css(".date-of-receipt"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.css(".gender"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.css(".age"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.css(".severity"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.css(".reactions"))
      assert(elements.length)
    }
    assert(await driver.findElement(By.css(".group-head:nth-child(2) .group-head-content")).getText() == "Prozac\\\\nTotal number of adverse events: 16 ")
    await driver.findElement(By.css(".group-head:nth-child(2) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-body:nth-child(3) > .td-accordion-parent:nth-child(1) > td:nth-child(5)")).getText() == "Toxicity to various agents, Completed suicide ")
    await driver.findElement(By.css(".group-body:nth-child(3) > .td-accordion-parent:nth-child(1) .accordion-control")).click()
    {
      const elements = await driver.findElements(By.css(".group-body:nth-child(3) > .td-accordion-child:nth-child(2) p:nth-child(1)"))
      assert(elements.length)
    }
    assert(await driver.findElement(By.css(".group-body:nth-child(3) > .td-accordion-child:nth-child(2) p:nth-child(1)")).getText() == "Safety Report ID: 14527027")
    {
      const elements = await driver.findElements(By.css(".group-body:nth-child(3) > .td-accordion-child:nth-child(2) p:nth-child(2)"))
      assert(elements.length)
    }
    assert(await driver.findElement(By.css(".group-body:nth-child(3) > .td-accordion-child:nth-child(2) p:nth-child(2)")).getText() == "Medications Involved: FLUOXETINE HYDROCHLORIDE. - Suspect\\\\nATORVASTATIN CALCIUM. - Suspect\\\\nLEVOTHYROXINE SODIUM. - Suspect\\\\nDIPHENHYDRAMINE HCL - Suspect\\\\nGABAPENTIN. - Suspect\\\\nACETAMINOPHEN AND DIPHENHYDRAMINE HYDROCHLORIDE - Suspect\\\\nCYCLOBENZAPRINE. - Suspect\\\\nLORAZEPAM. - Suspect")
    assert(await driver.findElement(By.css(".group-head:nth-child(4) .group-head-content")).getText() == "Losartan Potassium\\\\nTotal number of adverse events: 11 ")
    await driver.findElement(By.css(".group-head:nth-child(4) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(6) .group-head-content")).getText() == "Robaxin\\\\nTotal number of adverse events: 1 ")
    await driver.findElement(By.css(".group-head:nth-child(6) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(8) .group-head-content")).getText() == "LEVOLEUCOVORIN CALCIUM\\\\nTotal number of adverse events: 0 ")
    await driver.findElement(By.css(".group-head:nth-child(8) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(10) .group-head-content")).getText() == "acyclovir\\\\nTotal number of adverse events: 6 ")
    await driver.findElement(By.css(".group-head:nth-child(10) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(12) .group-head-content")).getText() == "Carvedilol\\\\nTotal number of adverse events: 10 ")
    await driver.findElement(By.css(".group-head:nth-child(12) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(14) .group-head-content")).getText() == "Hydrochlorothiazide\\\\nTotal number of adverse events: 27 ")
    await driver.findElement(By.css(".group-head:nth-child(14) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(16) .group-head-content")).getText() == "Fentanyl System\\\\nTotal number of adverse events: 132 ")
    await driver.findElement(By.css(".group-head:nth-child(16) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(18) .group-head-content")).getText() == "Amitiza\\\\nTotal number of adverse events: 0 ")
    await driver.findElement(By.css(".group-head:nth-child(18) .group-head-content")).click()
  })
  it('Recalls', async function() {
    await driver.get("https://pagweb:pagwebpass@pagweb-prototype.conceptant.com//recalls")
    await driver.manage().window().setRect(1552, 840)
    assert(await driver.getTitle() == "drugInteractions | PAG Simulated Portal")
    await driver.switchTo().frame(0)
    assert(await driver.findElement(By.css(".content-box > .content-title:nth-child(1)")).getText() == "My Medications Potential Recalls")
    assert(await driver.findElement(By.css(".content-title:nth-child(2)")).getText() == "The data presented here is for informational purposes only. Please discuss this information with your healthcare practitioner(s)")
    {
      const elements = await driver.findElements(By.css(".start-date"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.css(".status"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.css(".classification"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.css(".firm"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.css(".coverage-area"))
      assert(elements.length)
    }
    assert(await driver.findElement(By.css(".group-head:nth-child(2) .group-head-content")).getText() == "Losartan Potassium\\\\nTotal number of recalls: 33 ")
    await driver.findElement(By.css(".group-head:nth-child(2) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(4) .group-head-content")).getText() == "Robaxin\\\\nTotal number of recalls: 2 ")
    await driver.findElement(By.css(".group-head:nth-child(4) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-body:nth-child(5) > .td-accordion-parent:nth-child(1) > td:nth-child(5)")).getText() == "Nationwide in the USA. ")
    assert(await driver.findElement(By.css(".group-body:nth-child(5) > .td-accordion-parent:nth-child(1) > td:nth-child(4)")).getText() == "Endo Pharmaceuticals, Inc.")
    await driver.findElement(By.css(".group-body:nth-child(5) > .td-accordion-parent:nth-child(1) .accordion-control")).click()
    assert(await driver.findElement(By.css(".group-body:nth-child(5) > .td-accordion-child:nth-child(2) p:nth-child(1)")).getText() == "Reason for Recall: Labeling: Incorrect Instructions: Dosage information on the immediate container label incorrectly states \\\"Two to four tablets four times daily.\\\" rather than the correct dosage of \\\"Two tablets three times daily.\\\"")
    assert(await driver.findElement(By.css(".group-body:nth-child(5) > .td-accordion-child:nth-child(2) p:nth-child(2)")).getText() == "Product Information: Lot #: 216702P1, Exp 09/20; 220409P1, Exp 01/21")
    assert(await driver.findElement(By.css(".group-head:nth-child(6) .group-head-content")).getText() == "LEVOLEUCOVORIN CALCIUM\\\\nTotal number of recalls: 2 ")
    await driver.findElement(By.css(".group-head:nth-child(6) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(8) .group-head-content")).getText() == "acyclovir\\\\nTotal number of recalls: 3 ")
    await driver.findElement(By.css(".group-head:nth-child(8) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(10) .group-head-content")).getText() == "Carvedilol\\\\nTotal number of recalls: 3 ")
    await driver.findElement(By.css(".group-head:nth-child(10) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(12) .group-head-content")).getText() == "Hydrochlorothiazide\\\\nTotal number of recalls: 2 ")
    await driver.findElement(By.css(".group-head:nth-child(12) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(14) .group-head-content")).getText() == "Fentanyl System\\\\nTotal number of recalls: 2 ")
    await driver.findElement(By.css(".group-head:nth-child(14) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(16) .group-head-content")).getText() == "Amitiza\\\\nTotal number of recalls: 3 ")
    await driver.findElement(By.css(".group-head:nth-child(16) .group-head-content")).click()
  })
  it('Drugs Visualization', async function() {
    await driver.get("https://pagweb:pagwebpass@pagweb-prototype.conceptant.com//drugsVisualization")
    await driver.manage().window().setRect(1552, 840)
    assert(await driver.getTitle() == "drugsVisualization | PAG Simulated Portal")
    await driver.switchTo().frame(0)
    assert(await driver.findElement(By.css(".content-title:nth-child(1)")).getText() == "Drugs Interactions Visual Map")
    assert(await driver.findElement(By.css(".content-title:nth-child(3)")).getText() == "The data presented here is for informational purposes only. Please discuss this information with your healthcare practitioner(s)")
    assert(await driver.findElement(By.css(".group-1010654 tspan:nth-child(2)")).getText() == "Robaxin")
    assert(await driver.findElement(By.css(".group-200031")).getText() == "Carvedilol")
    assert(await driver.findElement(By.css(".group-617768 tspan:nth-child(2)")).getText() == "Amitiza")
    assert(await driver.findElement(By.css(".group-577057 tspan:nth-child(2)")).getText() == "Fentanyl")
    assert(await driver.findElement(By.css(".group-577057 tspan:nth-child(3)")).getText() == "System")
    assert(await driver.findElement(By.css(".group-104849 tspan:nth-child(2)")).getText() == "Prozac")
    {
      const element = await driver.findElement(By.css(".group-429503 tspan:nth-child(2)"))
      await driver.actions({ bridge: true }).moveToElement(element).perform()
    }
    assert(await driver.findElement(By.css(".group-429503 tspan:nth-child(2)")).getText() == "Hydrochlorothia...")
    assert(await driver.findElement(By.css(".group-979492 tspan:nth-child(2)")).getText() == "Losartan")
    {
      const element = await driver.findElement(By.css(".group-979492 tspan:nth-child(3)"))
      await driver.actions({ bridge: true }).moveToElement(element).perform()
    }
    assert(await driver.findElement(By.css(".group-979492 tspan:nth-child(3)")).getText() == "Potass...")
    assert(await driver.findElement(By.css(".group-197311 tspan:nth-child(2)")).getText() == "acyclovir")
    {
      const element = await driver.findElement(By.css(".group-1720773 tspan:nth-child(2)"))
      await driver.actions({ bridge: true }).moveToElement(element).perform()
    }
    assert(await driver.findElement(By.css(".group-1720773 tspan:nth-child(2)")).getText() == "LEVOLEUCOVORIN...")
  })
  it('NDC Lookup', async function() {
    await driver.get("https://pagweb:pagwebpass@pagweb-prototype.conceptant.com//ndcLookup")
    await driver.manage().window().setRect(1552, 840)
    assert(await driver.getTitle() == "ndcLookup | PAG Simulated Portal")
    await driver.switchTo().frame(0)
    assert(await driver.findElement(By.css(".content-title:nth-child(1)")).getText() == "NDC Lookup")
    assert(await driver.findElement(By.css(".content-title:nth-child(2)")).getText() == "The data presented here is for informational purposes only. Please discuss this information with your healthcare practitioner(s)")
    await driver.findElement(By.css(".ndc-lookup__input")).click()
    await driver.findElement(By.css(".ndc-lookup__input")).sendKeys("ASPIRIN")
    assert(await driver.findElement(By.css(".ndc-lookup__suggestions-item:nth-child(1)")).getText() == "ASPIRIN (00440113090)")
    await driver.findElement(By.css(".ndc-lookup__suggestions-item:nth-child(1)")).click()
    assert(await driver.findElement(By.css("p:nth-child(1)")).getText() == "NDC: 00440113090")
    assert(await driver.findElement(By.css("p:nth-child(2)")).getText() == "Brand Name: ASPIRIN")
  })
  it('Graph View Widget Example', async function() {
    await driver.get("https://pagweb:pagwebpass@pagweb-prototype.conceptant.com//graphViewWidget")
    await driver.manage().window().setRect(1552, 840)
    assert(await driver.getTitle() == "graphViewWidget | PAG Simulated Portal")
    await driver.switchTo().frame(0)
    assert(await driver.findElement(By.css(".hc-chart-widget__list-title")).getText() == "Potential Side Effects For My Current Medications")
    {
      const elements = await driver.findElements(By.linkText("Prozac"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.linkText("Losartan Potassium"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.linkText("Robaxin"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.linkText("LEVOLEUCOVORIN CALCIUM"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.linkText("acyclovir"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.linkText("Carvedilol"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.linkText("Hydrochlorothiazide"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.linkText("Fentanyl System"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.linkText("Amitiza"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.id("chart"))
      assert(elements.length)
    }
  })
  it('Multiple Widgets Example / Adverse Events', async function() {
    await driver.get("https://pagweb:pagwebpass@pagweb-prototype.conceptant.com//multipleWidgets")
    await driver.manage().window().setRect(1552, 840)
    assert(await driver.getTitle() == "multipleWidgets | PAG Simulated Portal")
    await driver.findElement(By.linkText("Adverse Events")).click()
    assert(await driver.findElement(By.css(".semi-bold")).getText() == "Multiple widgets initialization.")
    assert(await driver.findElement(By.xpath("//div[@id=\'content\']/adp-section-container[2]/div/div/p")).getText() == "To embed multiple widget add following code to your page:")
    assert(await driver.findElement(By.xpath("//div[@id=\'content\']/adp-section-container[2]/div/div/pre")).getText() == "<script>\\\\n  (function(d, s, id){\\\\n      var js, fjs = d.getElementsByTagName(s)[0];\\\\n      if (d.getElementById(id)) {return;}\\\\n      js = d.createElement(s); js.id = id;\\\\n      js.src = \\\"https://widget-manager-backend.conceptant.com/widget-server/hc-widget.js\\\";\\\\n      fjs.parentNode.insertBefore(js, fjs);\\\\n  }(document, \\\'script\\\', \\\'hc-widget\\\'))\\\\n</script>\\\\n\\\\n// Drug visualization\\\\n<div\\\\n    data-fhir-id=\\\"your FHIR id\\\"\\\\n    data-fhir-data-url=\\\"FHIR server url\\\"\\\\n    data-widget-id=\\\"widget id\\\"\\\\n</div>\\\\n\\\\n// Adverse events\\\\n<div\\\\n    data-fhir-id=\\\"your FHIR id\\\"\\\\n    data-fhir-data-url=\\\"FHIR server url\\\"\\\\n    data-widget-id=\\\"widget id\\\"\\\\n    data-age=\\\"35-44\\\"\\\\n    data-gender=\\\"M\\\"\\\\n</div>\\\\n\\\\n// NDC lookup\\\\n<div\\\\n    data-fhir-id=\\\"your FHIR id\\\"\\\\n    data-fhir-data-url=\\\"FHIR server url\\\"\\\\n    data-widget-id=\\\"widget id\\\"\\\\n</div>")
    await driver.sleep(5000)
    await driver.switchTo().frame(1)
    assert(await driver.findElement(By.css(".content-box > .content-title:nth-child(1)")).getText() == "Potential Adverse Events For My Current Medications")
    assert(await driver.findElement(By.css(".content-title:nth-child(2)")).getText() == "The data presented here is for informational purposes only. Please discuss this information with your healthcare practitioner(s) ")
    {
      const elements = await driver.findElements(By.css(".date-of-receipt"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.css(".gender"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.css(".age"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.css(".severity"))
      assert(elements.length)
    }
    {
      const elements = await driver.findElements(By.css(".reactions"))
      assert(elements.length)
    }
    assert(await driver.findElement(By.css(".group-head:nth-child(2) .group-head-content")).getText() == "Prozac\\\\nTotal number of adverse events: 16 ")
    await driver.findElement(By.css(".group-head:nth-child(2) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-body:nth-child(3) > .td-accordion-parent:nth-child(1) > td:nth-child(5)")).getText() == "Toxicity to various agents, Completed suicide ")
    await driver.findElement(By.css(".group-body:nth-child(3) > .td-accordion-parent:nth-child(1) .accordion-control")).click()
    {
      const elements = await driver.findElements(By.css(".group-body:nth-child(3) > .td-accordion-child:nth-child(2) p:nth-child(1)"))
      assert(elements.length)
    }
    assert(await driver.findElement(By.css(".group-body:nth-child(3) > .td-accordion-child:nth-child(2) p:nth-child(1)")).getText() == "Safety Report ID: 14527027")
    {
      const elements = await driver.findElements(By.css(".group-body:nth-child(3) > .td-accordion-child:nth-child(2) p:nth-child(2)"))
      assert(elements.length)
    }
    assert(await driver.findElement(By.css(".group-body:nth-child(3) > .td-accordion-child:nth-child(2) p:nth-child(2)")).getText() == "Medications Involved: FLUOXETINE HYDROCHLORIDE. - Suspect\\\\nATORVASTATIN CALCIUM. - Suspect\\\\nLEVOTHYROXINE SODIUM. - Suspect\\\\nDIPHENHYDRAMINE HCL - Suspect\\\\nGABAPENTIN. - Suspect\\\\nACETAMINOPHEN AND DIPHENHYDRAMINE HYDROCHLORIDE - Suspect\\\\nCYCLOBENZAPRINE. - Suspect\\\\nLORAZEPAM. - Suspect")
    assert(await driver.findElement(By.css(".group-head:nth-child(4) .group-head-content")).getText() == "Losartan Potassium\\\\nTotal number of adverse events: 11 ")
    await driver.findElement(By.css(".group-head:nth-child(4) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(6) .group-head-content")).getText() == "Robaxin\\\\nTotal number of adverse events: 1 ")
    await driver.findElement(By.css(".group-head:nth-child(6) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(8) .group-head-content")).getText() == "LEVOLEUCOVORIN CALCIUM\\\\nTotal number of adverse events: 0 ")
    await driver.findElement(By.css(".group-head:nth-child(8) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(10) .group-head-content")).getText() == "acyclovir\\\\nTotal number of adverse events: 6 ")
    await driver.findElement(By.css(".group-head:nth-child(10) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(12) .group-head-content")).getText() == "Carvedilol\\\\nTotal number of adverse events: 10 ")
    await driver.findElement(By.css(".group-head:nth-child(12) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(14) .group-head-content")).getText() == "Hydrochlorothiazide\\\\nTotal number of adverse events: 27 ")
    await driver.findElement(By.css(".group-head:nth-child(14) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(16) .group-head-content")).getText() == "Fentanyl System\\\\nTotal number of adverse events: 132 ")
    await driver.findElement(By.css(".group-head:nth-child(16) .group-head-content")).click()
    assert(await driver.findElement(By.css(".group-head:nth-child(18) .group-head-content")).getText() == "Amitiza\\\\nTotal number of adverse events: 0 ")
    await driver.findElement(By.css(".group-head:nth-child(18) .group-head-content")).click()
  })
  it('Multiple Widgets Examples / Drugs Visualization', async function() {
    await driver.get("https://pagweb:pagwebpass@pagweb-prototype.conceptant.com//multipleWidgets")
    await driver.manage().window().setRect(1552, 840)
    assert(await driver.getTitle() == "multipleWidgets | PAG Simulated Portal")
    await driver.findElement(By.linkText("Drug Interactions Visual lMap")).click()
    assert(await driver.findElement(By.css(".semi-bold")).getText() == "Multiple widgets initialization.")
    assert(await driver.findElement(By.xpath("//div[@id=\'content\']/adp-section-container[2]/div/div/p")).getText() == "To embed multiple widget add following code to your page:")
    assert(await driver.findElement(By.xpath("//div[@id=\'content\']/adp-section-container[2]/div/div/pre")).getText() == "<script>\\\\n  (function(d, s, id){\\\\n      var js, fjs = d.getElementsByTagName(s)[0];\\\\n      if (d.getElementById(id)) {return;}\\\\n      js = d.createElement(s); js.id = id;\\\\n      js.src = \\\"https://widget-manager-backend.conceptant.com/widget-server/hc-widget.js\\\";\\\\n      fjs.parentNode.insertBefore(js, fjs);\\\\n  }(document, \\\'script\\\', \\\'hc-widget\\\'))\\\\n</script>\\\\n\\\\n// Drug visualization\\\\n<div\\\\n    data-fhir-id=\\\"your FHIR id\\\"\\\\n    data-fhir-data-url=\\\"FHIR server url\\\"\\\\n    data-widget-id=\\\"widget id\\\"\\\\n</div>\\\\n\\\\n// Adverse events\\\\n<div\\\\n    data-fhir-id=\\\"your FHIR id\\\"\\\\n    data-fhir-data-url=\\\"FHIR server url\\\"\\\\n    data-widget-id=\\\"widget id\\\"\\\\n    data-age=\\\"35-44\\\"\\\\n    data-gender=\\\"M\\\"\\\\n</div>\\\\n\\\\n// NDC lookup\\\\n<div\\\\n    data-fhir-id=\\\"your FHIR id\\\"\\\\n    data-fhir-data-url=\\\"FHIR server url\\\"\\\\n    data-widget-id=\\\"widget id\\\"\\\\n</div>")
    await driver.switchTo().frame(0)
    assert(await driver.findElement(By.css(".content-title:nth-child(1)")).getText() == "Drugs Interactions Visual Map")
    assert(await driver.findElement(By.css(".content-title:nth-child(3)")).getText() == "The data presented here is for informational purposes only. Please discuss this information with your healthcare practitioner(s)")
    assert(await driver.findElement(By.css(".group-1010654 tspan:nth-child(2)")).getText() == "Robaxin")
    assert(await driver.findElement(By.css(".group-200031")).getText() == "Carvedilol")
    assert(await driver.findElement(By.css(".group-617768 tspan:nth-child(2)")).getText() == "Amitiza")
    assert(await driver.findElement(By.css(".group-577057 tspan:nth-child(2)")).getText() == "Fentanyl")
    assert(await driver.findElement(By.css(".group-577057 tspan:nth-child(3)")).getText() == "System")
    assert(await driver.findElement(By.css(".group-104849 tspan:nth-child(2)")).getText() == "Prozac")
    {
      const element = await driver.findElement(By.css(".group-429503 tspan:nth-child(2)"))
      await driver.actions({ bridge: true }).moveToElement(element).perform()
    }
    assert(await driver.findElement(By.css(".group-429503 tspan:nth-child(2)")).getText() == "Hydrochlorothia...")
    assert(await driver.findElement(By.css(".group-979492 tspan:nth-child(2)")).getText() == "Losartan")
    {
      const element = await driver.findElement(By.css(".group-979492 tspan:nth-child(3)"))
      await driver.actions({ bridge: true }).moveToElement(element).perform()
    }
    assert(await driver.findElement(By.css(".group-979492 tspan:nth-child(3)")).getText() == "Potass...")
    assert(await driver.findElement(By.css(".group-197311 tspan:nth-child(2)")).getText() == "acyclovir")
    {
      const element = await driver.findElement(By.css(".group-1720773 tspan:nth-child(2)"))
      await driver.actions({ bridge: true }).moveToElement(element).perform()
    }
    assert(await driver.findElement(By.css(".group-1720773 tspan:nth-child(2)")).getText() == "LEVOLEUCOVORIN...")
  })
  it('Multiple Widgets Example / NDC Lookup', async function() {
    await driver.get("https://pagweb:pagwebpass@pagweb-prototype.conceptant.com//multipleWidgets")
    await driver.manage().window().setRect(1552, 840)
    assert(await driver.getTitle() == "multipleWidgets | PAG Simulated Portal")
    await driver.findElement(By.linkText("NDC lookup")).click()
    assert(await driver.findElement(By.css(".semi-bold")).getText() == "Multiple widgets initialization.")
    assert(await driver.findElement(By.xpath("//div[@id=\'content\']/adp-section-container[2]/div/div/p")).getText() == "To embed multiple widget add following code to your page:")
    assert(await driver.findElement(By.xpath("//div[@id=\'content\']/adp-section-container[2]/div/div/pre")).getText() == "<script>\\\\n  (function(d, s, id){\\\\n      var js, fjs = d.getElementsByTagName(s)[0];\\\\n      if (d.getElementById(id)) {return;}\\\\n      js = d.createElement(s); js.id = id;\\\\n      js.src = \\\"https://widget-manager-backend.conceptant.com/widget-server/hc-widget.js\\\";\\\\n      fjs.parentNode.insertBefore(js, fjs);\\\\n  }(document, \\\'script\\\', \\\'hc-widget\\\'))\\\\n</script>\\\\n\\\\n// Drug visualization\\\\n<div\\\\n    data-fhir-id=\\\"your FHIR id\\\"\\\\n    data-fhir-data-url=\\\"FHIR server url\\\"\\\\n    data-widget-id=\\\"widget id\\\"\\\\n</div>\\\\n\\\\n// Adverse events\\\\n<div\\\\n    data-fhir-id=\\\"your FHIR id\\\"\\\\n    data-fhir-data-url=\\\"FHIR server url\\\"\\\\n    data-widget-id=\\\"widget id\\\"\\\\n    data-age=\\\"35-44\\\"\\\\n    data-gender=\\\"M\\\"\\\\n</div>\\\\n\\\\n// NDC lookup\\\\n<div\\\\n    data-fhir-id=\\\"your FHIR id\\\"\\\\n    data-fhir-data-url=\\\"FHIR server url\\\"\\\\n    data-widget-id=\\\"widget id\\\"\\\\n</div>")
    await driver.switchTo().frame(2)
    assert(await driver.findElement(By.css(".content-title:nth-child(1)")).getText() == "NDC Lookup")
    assert(await driver.findElement(By.css(".content-title:nth-child(2)")).getText() == "The data presented here is for informational purposes only. Please discuss this information with your healthcare practitioner(s)")
    await driver.findElement(By.css(".ndc-lookup__input")).click()
    await driver.findElement(By.css(".ndc-lookup__input")).sendKeys("ASPIRIN")
    assert(await driver.findElement(By.css(".ndc-lookup__suggestions-item:nth-child(1)")).getText() == "ASPIRIN (00440113090)")
    await driver.findElement(By.css(".ndc-lookup__suggestions-item:nth-child(1)")).click()
    assert(await driver.findElement(By.css("p:nth-child(1)")).getText() == "NDC: 00440113090")
    assert(await driver.findElement(By.css("p:nth-child(2)")).getText() == "Brand Name: ASPIRIN")
  })
  it('Logout', async function() {
    await driver.get("https://pagweb:pagwebpass@pagweb-prototype.conceptant.com//users")
    await driver.manage().window().setRect(1552, 840)
    await driver.wait(until.elementLocated(By.css(".header-avatar")), 30000)
    assert(await driver.getTitle() == "My Profile | PAG Simulated Portal")
    await driver.findElement(By.css(".header-avatar")).click()
    await driver.findElement(By.css("strong")).click()
    await driver.findElement(By.css(".adp-action-b-primary")).click()
    await driver.wait(until.elementLocated(By.css(".smart-form-header > .ng-scope")), 30000)
    assert(await driver.getTitle() == "Login | PAG Simulated Portal")
  })
})
