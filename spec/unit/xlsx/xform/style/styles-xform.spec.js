const fs = require('fs');

const testXformHelper = require('../test-xform-helper');

const StylesXform = verquire('xlsx/xform/style/styles-xform');
const XmlStream = verquire('utils/xml-stream');

const expectations = [
  {
    title: 'Styles with fonts',
    create() {
      return new StylesXform();
    },
    preparedModel: require('./data/styles.1.1.json'),
    xml: fs.readFileSync(`${__dirname}/data/styles.1.2.xml`).toString(),
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('StylesXform', () => {
  testXformHelper(expectations);

  it('Parses styles with 26 dxfs including a border dxf containing vertical/horizontal tags', () =>
    new Promise((resolve, reject) => {
      const xml = fs.readFileSync(`${__dirname}/data/styles.dxfs.26.xml`);
      const stream = new PassThrough();
      stream.end(xml);

      const xform = new StylesXform();
      xform
        .parse(parseSax(stream))
        .then(model => {
          expect(model.dxfs).to.be.an('array').with.lengthOf(26);

          // the border dxf (12th entry) must parse without breaking subsequent dxfs
          expect(model.dxfs[11].border).to.deep.equal({
            left: {style: 'thin', color: {argb: 'FFFF0000'}},
            right: {style: 'thin', color: {argb: 'FFFF0000'}},
          });

          // ensure we didn't stop parsing at the border dxf
          expect(model.dxfs[25].fill.type).to.equal('pattern');
          expect(model.dxfs[25].fill.bgColor).to.deep.equal({theme: 0, tint: -0.14996795556505021});

          resolve();
        })
        .catch(reject);
    }));

  describe('As StyleManager', () => {
    it('Renders empty model', () => {
      const stylesXform = new StylesXform(true);
      const expectedXml = fs
        .readFileSync(`${__dirname}/data/styles.2.2.xml`)
        .toString();

      const xmlStream = new XmlStream();
      stylesXform.render(xmlStream);

      expect(xmlStream.xml).xml.to.equal(expectedXml);
    });
  });
});
