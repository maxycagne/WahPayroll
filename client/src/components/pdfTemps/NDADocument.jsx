import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

// Legal size: 8.5x14 inches = 612 x 1008 pt
const styles = StyleSheet.create({
  page: {
    backgroundColor: 'white',
    fontFamily: 'Times-Roman',
    color: '#101010',
    fontSize: 12,
    paddingTop: 54,
    paddingBottom: 54,
    paddingLeft: 72,
    paddingRight: 72,
    lineHeight: 1.55,
    position: 'relative',
  },
  docTitle: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  docSubtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 2
  },
  labelAllMen: {
    fontWeight: 700,
    marginBottom: 11,
    marginTop: 10,
    letterSpacing: 0.8,
  },
  paragraph: {
    textAlign: 'justify',
    marginBottom: 9,
  },
  andLine: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
    fontSize: 12,
  },
  underlineBlockRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 6,
  },
  underline: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    minWidth: 80,
    maxWidth: 180,
    height: 13,
    marginHorizontal: 5,
  },
  underlineShort: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    minWidth: 42,
    maxWidth: 90,
    height: 13,
    marginHorizontal: 4,
  },
  underlineExtra: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    minWidth: 105,
    maxWidth: 200,
    height: 13,
    marginHorizontal: 5,
  },
  partyBlock: {
    marginBottom: 7,
    textAlign: 'justify',
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 5,
    fontWeight: 700,
    textTransform: 'uppercase',
    fontSize: 11.5,
    letterSpacing: 0.7,
  },
  sectionContent: {
    fontSize: 11,
    lineHeight: 1.57,
    textAlign: 'justify',
    marginBottom: 8,
    marginTop: 1,
  },
  subSectionTitle: {
    fontWeight: 700,
    textTransform: 'uppercase',
    fontSize: 11,
    marginBottom: 4,
    marginTop: 14
  },
  underlineDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginTop: 13,
    marginBottom: 12
  },
  bold: { fontWeight: 700 },
  underlineText: { textDecoration: 'underline' },

  signNotice: {
    fontWeight: 700,
    fontSize: 11,
    marginTop: 32,
    marginBottom: 20,
    textAlign: 'center'
  },
  inlineSign: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 16,
    width: '100%',
  },
  signCol: {
    width: '45%',
    alignItems: 'center',
  },
  signColRight: {
    width: '45%',
    alignItems: 'center',
  },
  signLabel: {
    fontSize: 10,
    marginBottom: 8,
    fontWeight: 700,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  signatureBox: {
    width: 180,
    alignItems: 'center',
    marginBottom: 0,
  },
  signatureLineBox: {
    width: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    position: 'relative'
  },
  signatureName: {
    fontSize: 10.7,
    fontWeight: 700,
    textAlign: 'center',
    backgroundColor: 'white',
    zIndex: 2,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    width: 180,
    height: 16,
    zIndex: 1,
  },
  signatureRole: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  presenceNotice: {
    fontWeight: 700,
    fontSize: 11,
    marginTop: 32,
    marginBottom: 20,
    textAlign: 'center'
  },
  presenceRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  presenceCol: { alignItems: 'center', width: '44%' },
  presenceWitness: {
    fontWeight: 700,
    fontSize: 10.7,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    width: 160,
    alignSelf: 'center',
    textAlign: 'center',
    marginBottom: 0,
    paddingBottom: 1,
  },
  presenceRole: { fontSize: 10, marginTop: 3, textAlign: 'center' },
  pageFooter: {
    position: 'absolute',
    bottom: 32,
    left: 72,
    right: 72,
    textAlign: 'right',
    fontSize: 9,
    color: '#444',
    fontStyle: 'italic',
  },
});

const NDADocument = () => (
  <Document>
    <Page size="LEGAL" style={styles.page}>
      <Text style={styles.docTitle}>NON-DISCLOSURE AGREEMENT</Text>
      <Text style={styles.docSubtitle}>Access to WAH Platform (For Internship)</Text>
      <Text style={styles.labelAllMen}>KNOW ALL MEN BY THESE PRESENTS:</Text>
      <Text style={[styles.paragraph, { fontWeight: 700 }]} >
        This AGREEMENT, made and executed by and between:
      </Text>
      <Text style={styles.partyBlock}>
        <Text style={styles.bold}>WIRELESS ACCESS FOR HEALTH INITIATIVE, INC. (WAH-NGO)</Text>,
        a non-profit, organization with office address at 2nd Floor, Room 2, Diwa ng Tarlac, Romulo Blvd, San Vicente, Tarlac City, Philippines, represented herein by <Text style={styles.bold}>Robert Michael Martinez</Text> Supervising Partner for Network and System Partner, hereinafter referred to as the <Text style={styles.bold}>"FIRST PARTY".
        </Text>
      </Text>

      <Text style={styles.andLine}>-AND-</Text>
      {/* Blanks for intern info */}
      <View style={styles.underlineBlockRow}>
        <View style={styles.underlineExtra} />
        <Text>, a Employee of WIRELESS ACCESS FOR HEALTH INC. , with</Text>
        <Text>Employee ID Number</Text>
        <Text>&nbsp; AAA-999 &nbsp;</Text>
        <Text> and residence address at</Text>
        <View style={styles.underlineExtra} />
        <Text>, hereinafter referred to as the </Text>
        <Text style={styles.bold}>"SECOND PARTY"</Text>
        <Text> or </Text>
        <Text style={styles.bold}>"EMPLOYEE."</Text>
      </View>
      <View style={styles.underlineDivider} />

      {/* WHEREAS Section */}
      <Text style={styles.sectionTitle}>WITNESSETH:</Text>
      <Text style={styles.sectionContent}>
        <Text style={styles.bold}>WHEREAS</Text>, the FIRST PARTY, pursuant to its partnership with <View style={styles.underlineShort} /> and other academic institutions, provides internship opportunities involving access to digital health systems and platforms;
      </Text>
      <Text style={styles.sectionContent}>
        <Text style={styles.bold}>WHEREAS</Text>, the FIRST PARTY operates digital health platforms integrated with the <Text style={styles.bold}>Philippine Health Information Exchange (PHIE)</Text> and other government health information systems;
      </Text>
      <Text style={styles.sectionContent}>
        <Text style={styles.bold}>WHEREAS</Text>, the SECOND PARTY, by virtue of the internship, may have access to <Text style={styles.bold}>personal information, sensitive personal information, and privileged health data as defined under the Data Privacy Act of 2012</Text>;
      </Text>
      <Text style={styles.sectionContent}>
        <Text style={styles.bold}>WHEREAS</Text>, the SECOND PARTY acknowledges that all such data are protected under applicable laws, rules, and regulations, including issuances of the National Privacy Commission (NPC);
      </Text>
      <Text style={styles.sectionContent}>
        <Text style={styles.bold}>NOW, THEREFORE</Text>, for and in consideration of the foregoing, the SECOND PARTY agrees to the following:
      </Text>

      {/* A */}
      <Text style={styles.subSectionTitle}>A. DATA PRIVACY AND CONFIDENTIALITY OBLIGATIONS</Text>
      <Text style={styles.paragraph}>
        The SECOND PARTY acknowledges that "Confidential Information" includes, but is not limited to, personal information, sensitive personal information such as health records and PhilHealth data, system credentials, reports, analytics, and any non-public data accessed through the Wireless Access for Health (WAH) platforms and the Philippine Health Information Exchange (PHIE).
      </Text>
      <Text style={styles.paragraph}>
        The SECOND PARTY shall not disclose, share, transfer, publish, or otherwise make available any Confidential Information to any unauthorized person, entity, or third party without prior written consent from the FIRST PARTY. Access to the WAH platform and related systems shall be strictly limited to authorized users approved by the FIRST PARTY and shall only be conducted through official devices and systems registered with the FIRST PARTY. Any changes in access, devices, or personnel must be formally coordinated with and approved by the FIRST PARTY prior to implementation.
      </Text>
      <Text style={styles.paragraph}>
        The SECOND PARTY further agrees to adhere to the principles of data minimization and need-to-know, such that only data strictly necessary for the performance of assigned duties shall be accessed or processed, and disclosure within authorized personnel shall be limited accordingly in compliance with applicable data privacy principles.
      </Text>
      <Text style={styles.paragraph}>
        The SECOND PARTY shall not copy, download, reproduce, screenshot, extract, or otherwise use data for personal purposes or outside official duties, nor shall such data be stored in personal devices, unauthorized cloud storage, external drives, or any unapproved systems.
      </Text>
      {/* B */}
      <Text style={styles.subSectionTitle}>B. DATA SECURITY AND PROTECTION MEASURES</Text>
      <Text style={styles.paragraph}>
        The SECOND PARTY agrees to comply with all organizational, physical, and technical security measures implemented by the FIRST PARTY, including but not limited to maintaining secure login credentials, ensuring password confidentiality, utilizing encrypted systems where applicable, and practicing proper logout and workstation security at all times.
      </Text>
      <Text style={styles.paragraph}>
        The SECOND PARTY shall immediately report to the FIRST PARTY any actual or suspected data breach, unauthorized access, system vulnerability, or loss or compromise of devices containing data or access credentials. Failure to report such incidents in a timely manner shall constitute a violation of this Agreement.
      </Text>

      <View style={styles.underlineDivider} />
      {/* C */}
      <Text style={styles.subSectionTitle}>C. COMPLIANCE WITH LAWS AND REGULATIONS</Text>
      <Text style={styles.paragraph}>
        The SECOND PARTY agrees to comply with Republic Act No. 10173, otherwise known as the Data Privacy Act of 2012, its Implementing Rules and Regulations, and all issuances and circulars of the National Privacy Commission. The SECOND PARTY likewise agrees to comply with Department of Health and PhilHealth data governance policies, as well as the internal data privacy and security policies of Wireless Access for Health.
      </Text>
      {/* D */}
      <Text style={styles.subSectionTitle}>D. GENERAL PROVISIONS AND LIABILITIES</Text>
      <Text style={styles.paragraph}>
        This Agreement shall not be construed as granting the SECOND PARTY any ownership, license, or intellectual property rights over the WAH platform or any data contained therein.
      </Text>
      <Text style={styles.paragraph}>
        Any breach of this Agreement, including unauthorized disclosure or misuse of data, shall subject the SECOND PARTY to appropriate administrative sanctions, civil liabilities for damages, and criminal liabilities under applicable laws, including the Data Privacy Act of 2012.
      </Text>
      <Text style={styles.paragraph}>
        In the event of breach or threatened breach of any provision of this Agreement, the FIRST PARTY shall have the right to seek injunctive relief and pursue all available legal remedies.
      </Text>
      <Text style={styles.paragraph}>
        If any provision of this Agreement is declared invalid or unenforceable, the remaining provisions shall continue to be valid and enforceable to the fullest extent permitted by law.
      </Text>
      <Text style={styles.paragraph}>
        The obligations under this Agreement, particularly those relating to confidentiality and data privacy, shall continue to remain in full force and effect even after the termination or completion of the internship or engagement of the SECOND PARTY.
      </Text>
      {/* Signatures */}
      <Text style={{ marginTop: 38, marginBottom: 8, fontWeight: 700, fontSize: 11, textAlign: 'left' }}>
        IN WITNESS WHEREOF, the parties have hereunto affixed their signatures this ___ day of __________, 2026 in __________, Philippines.
      </Text>
      <Text style={[styles.bold, { marginBottom: 8, marginTop: 8 }]}>WIRELESS ACCESS FOR HEALTH INITIATIVE, INC.</Text>
      <View style={styles.inlineSign}>
        {/* FIRST PARTY */}
        <View style={styles.signCol}>
          <Text style={styles.signLabel}>FIRST PARTY</Text>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLineBox}>
              <Text style={styles.signatureName}>Kevin Greg Alvarado</Text>
              <View style={styles.signatureLine} />
            </View>
            <Text style={styles.signatureRole}>Data Protection Officer</Text>
          </View>
        </View>
        {/* SECOND PARTY */}
        <View style={styles.signColRight}>
          <Text style={styles.signLabel}>SECOND PARTY</Text>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLineBox}>
              <Text style={styles.signatureName}>Filson John L. Bequibel</Text>
              <View style={styles.signatureLine} />
            </View>
            <Text style={styles.signatureRole}>Employee</Text>
          </View>
        </View>
      </View>
      {/* Witnesses Row */}
      <Text style={styles.presenceNotice}>SIGNED IN THE PRESENCE OF:</Text>
      <View style={styles.presenceRow}>
        <View style={styles.presenceCol}>
          <Text style={styles.presenceWitness}>Ms. Jhuvy C. Dizon</Text>
          <Text style={styles.presenceRole}>Admin &amp; Operations Officer</Text>
        </View>
        <View style={styles.presenceCol}>
          <Text style={styles.presenceWitness}>Robert Michael Martinez</Text>
          <Text style={styles.presenceRole}>Supervising Partner for Network and System</Text>
        </View>
      </View>
      {/* Footer */}
      <Text style={styles.pageFooter}>
        Wireless Access for Health | NDA Internship | Page 2 / 2
      </Text>
    </Page>
  </Document>
);

export default NDADocument;