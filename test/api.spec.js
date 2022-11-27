import fetchMock from "fetch-mock";

describe("api", function () {
  this.beforeAll(() => {
    fetchMock.mock("http://example.com", 200);
  });

  this.afterAll(function () {
    fetchMock.restore();
  });

  describe("fetchPackage", function () {
    it("should work", async function () {
      const response = await fetch("http://example.com");

      expect(response.ok).to.be.true;
    });
  });
});
