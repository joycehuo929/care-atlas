// Conventional Hindi place names and common Roman spellings used in Indian addresses.
// The display form is never used as a facility identifier or routing coordinate.
const spellings = `
भारत|India
आंध्र प्रदेश|Andhra Pradesh|AndhraPradesh
अरुणाचल प्रदेश|Arunachal Pradesh
असम|Assam
बिहार|Bihar
छत्तीसगढ़|Chhattisgarh|Chattisgarh|Chhatisgarh
गोवा|Goa
गुजरात|Gujarat|Gujrat
हरियाणा|Haryana
हिमाचल प्रदेश|Himachal Pradesh
झारखंड|Jharkhand
कर्नाटक|Karnataka
केरल|Kerala
मध्य प्रदेश|Madhya Pradesh|MadhyaPradesh
महाराष्ट्र|Maharashtra|Maharastra
मणिपुर|Manipur
मेघालय|Meghalaya
मिज़ोरम|Mizoram
नागालैंड|Nagaland
ओडिशा|Odisha|Orissa|Odisa
पंजाब|Punjab
राजस्थान|Rajasthan
सिक्किम|Sikkim
तमिलनाडु|Tamil Nadu|Tamilnadu
तेलंगाना|Telangana|Telengana
त्रिपुरा|Tripura
उत्तर प्रदेश|Uttar Pradesh|UttarPradesh|Uttar Prades H
उत्तराखंड|Uttarakhand|Uttaranchal
पश्चिम बंगाल|West Bengal|WestBengal
अंडमान और निकोबार द्वीपसमूह|Andaman and Nicobar Islands|Andaman & Nicobar Islands|A & N Islands
चंडीगढ़|Chandigarh
दादरा और नगर हवेली और दमन और दीव|The Dadra and Nagar Haveli and Daman and Diu|Dadra and Nagar Haveli and Daman and Diu|Dadra & Nagar Haveli and Daman & Diu
दादरा और नगर हवेली|Dadra and Nagar Haveli|Dadra & Nagar Haveli
दमन और दीव|Daman and Diu|Daman & Diu
दिल्ली|Delhi|NCT of Delhi|National Capital Territory of Delhi|Delhi NCT|NCT Delhi
जम्मू और कश्मीर|Jammu and Kashmir|Jammu & Kashmir|J & K
लद्दाख|Ladakh
लक्षद्वीप|Lakshadweep
पुदुचेरी|Puducherry|Pondicherry
भुवनेश्वर|Bhubaneswar|Bhubaneshwar|Bhubaneshvar|Bhuvaneswar|Bhuvaneshwar|Bhubneswar|Bhubneshwar|Bhubaneshwar City
कटक|Cuttack
पुरी|Puri
राउरकेला|Rourkela|Raurkela
संबलपुर|Sambalpur
ब्रह्मपुर|Brahmapur|Berhampur
भद्रक|Bhadrak
बालासोर|Balasore|Baleswar
बालांगीर|Balangir|Bolangir
बारिपदा|Baripada
जाजपुर|Jajpur
झारसुगुड़ा|Jharsuguda
केंदुझर|Kendujhar|Keonjhar
कोरापुट|Koraput
पटना|Patna
बस्तर|Bastar
आरा|Arrah|Ara
बिहार शरीफ़|Bihar Sharif|Biharsharif
भागलपुर|Bhagalpur
बक्सर|Buxar
गया|Gaya
बोधगया|Bodh Gaya|Bodhgaya
दरभंगा|Darbhanga
मुज़फ्फरपुर|Muzaffarpur
बेगूसराय|Begusarai
कटिहार|Katihar
पूर्णिया|Purnia|Purnea
मोतिहारी|Motihari
सहरसा|Saharsa
समस्तीपुर|Samastipur
हाजीपुर|Hajipur
देसरी|Desari
सीतामढ़ी|Sitamarhi
दानापुर|Danapur|Dinapur
खगौल|Khagaul
फुलवारी शरीफ़|Phulwari Sharif|Phulwarisharif
छपरा|Chhapra|Chapra
सिवान|Siwan
सासाराम|Sasaram
मुंगेर|Munger
मधुबनी|Madhubani
किशनगंज|Kishanganj
पटना सिटी|Patna City
नई दिल्ली|New Delhi|NewDelhi
दक्षिण दिल्ली|South Delhi
उत्तर दिल्ली|North Delhi
पूर्वी दिल्ली|East Delhi
पश्चिम दिल्ली|West Delhi
मध्य दिल्ली|Central Delhi
दक्षिण पश्चिम दिल्ली|South West Delhi
दक्षिण पूर्व दिल्ली|South East Delhi
उत्तर पूर्व दिल्ली|North East Delhi
उत्तर पश्चिम दिल्ली|North West Delhi
शाहदरा|Shahdara
द्वारका|Dwarka
नोएडा|Noida
ग्रेटर नोएडा|Greater Noida
गाज़ियाबाद|Ghaziabad
गुरुग्राम|Gurugram
गुड़गाँव|Gurgaon
फ़रीदाबाद|Faridabad
लखनऊ|Lucknow
वाराणसी|Varanasi
बनारस|Banaras|Benares|Benaras
अयोध्या|Ayodhya
कानपुर|Kanpur
आगरा|Agra
प्रयागराज|Prayagraj
इलाहाबाद|Allahabad
मेरठ|Meerut
झाँसी|Jhansi
गोरखपुर|Gorakhpur
बरेली|Bareilly|Bareli
अलीगढ़|Aligarh
मथुरा|Mathura
वृंदावन|Vrindavan|Brindavan
मुरादाबाद|Moradabad
सहारनपुर|Saharanpur
मुज़फ़्फ़रनगर|Muzaffarnagar
हापुड़|Hapur
शाहजहाँपुर|Shahjahanpur
फ़िरोज़ाबाद|Firozabad
रायबरेली|Raebareli|Rae Bareli|Raebareilly
सुल्तानपुर|Sultanpur
बस्ती|Basti
मिर्ज़ापुर|Mirzapur
जौनपुर|Jaunpur
अम्बेडकर नगर|Ambedkar Nagar
आज़मगढ़|Azamgarh
अमेठी|Amethi
बलिया|Ballia
अमरोहा|Amroha
मैनपुरी|Mainpuri
भदोही|Bhadohi
देवरिया|Deoria
हाथरस|Hathras
इटावा|Etawah
गौतम बुद्ध नगर|Gautam Buddha Nagar|Gautam Buddh Nagar
गाज़ीपुर|Ghazipur
देहरादून|Dehradun|Dehra Dun
हरिद्वार|Haridwar|Hardwar
ऋषिकेश|Rishikesh
नैनीताल|Nainital
हल्द्वानी|Haldwani
रुड़की|Roorkee
रुद्रपुर|Rudrapur
शिमला|Shimla|Simla
धर्मशाला|Dharamshala|Dharamsala
मंडी|Mandi
सोलन|Solan
काँगड़ा|Kangra
हमीरपुर|Hamirpur
अम्बाला|Ambala
सोनीपत|Sonipat|Sonepat
पानीपत|Panipat
करनाल|Karnal
हिसार|Hisar|Hissar
रोहतक|Rohtak
पंचकूला|Panchkula
यमुनानगर|Yamunanagar|Yamuna Nagar
सिरसा|Sirsa
रेवाड़ी|Rewari
फ़तेहाबाद|Fatehabad
लुधियाना|Ludhiana
मोहाली|Mohali
साहिबज़ादा अजीत सिंह नगर|Sahibzada Ajit Singh Nagar|SAS Nagar|S A S Nagar
अमृतसर|Amritsar
जालंधर|Jalandhar|Jullundur
पटियाला|Patiala
बठिंडा|Bathinda|Bhatinda
पठानकोट|Pathankot
होशियारपुर|Hoshiarpur
मोगा|Moga
फ़िरोज़पुर|Firozpur|Ferozepur
श्रीनगर|Srinagar
जम्मू|Jammu
अनंतनाग|Anantnag
बारामूला|Baramulla|Baramula
उधमपुर|Udhampur
लेह|Leh
कारगिल|Kargil
मुंबई|Mumbai
बॉम्बे|Bombay
नवी मुंबई|Navi Mumbai|Navimumbai|New Mumbai
पुणे|Pune|Poona
नागपुर|Nagpur
नाशिक|Nashik|Nasik
ठाणे|Thane
कल्याण|Kalyan
डोंबिवली|Dombivli|Dombivali
पिंपरी-चिंचवड़|Pimpri Chinchwad|Pimpri-Chinchwad
पिंपरी|Pimpri
पनवेल|Panvel
पुराना पनवेल|Old Panvel
नया पनवेल|New Panvel
वाशी|Vashi
विरार|Virar
वसई|Vasai
मीरा रोड|Mira Road
मीरा-भायंदर|Mira Bhayandar|Mira Bhayander
विले पार्ले|Vile Parle
अंधेरी|Andheri
दादर|Dadar
बांद्रा|Bandra
मुलुंड|Mulund
बोरीवली|Borivali|Borivli
भायंदर|Bhayandar|Bhayander
उल्हासनगर|Ulhasnagar
भिवंडी|Bhiwandi
औरंगाबाद|Aurangabad
छत्रपति संभाजीनगर|Chhatrapati Sambhajinagar|Chhatrapati Sambhaji Nagar|Chatrapati Sambhaji Nagar
कोल्हापुर|Kolhapur
सोलापुर|Solapur|Sholapur
अमरावती|Amravati|Amaravati
अकोला|Akola
नांदेड़|Nanded
जालौन|Jalaun
जलगाँव|Jalgaon
अहमदनगर|Ahmednagar|Ahmadnagar
सांगली|Sangli
सतारा|Satara
रत्नागिरी|Ratnagiri
लातूर|Latur
चंद्रपुर|Chandrapur
वर्धा|Wardha
गोंदिया|Gondia|Gondiya
धुले|Dhule
पालघर|Palghar
यवतमाल|Yavatmal
कोलकाता|Kolkata|Calcutta|Kolkota
हावड़ा|Howrah|Haora
दुर्गापुर|Durgapur
आसनसोल|Asansol
सिलीगुड़ी|Siliguri
खड़गपुर|Kharagpur
बर्धमान|Bardhaman|Burdwan
बैरकपुर|Barrackpore|Barrackpur
दार्जिलिंग|Darjeeling
हुगली|Hooghly|Hugli
मालदा|Malda|Maldah
हल्दिया|Haldia
बारासात|Barasat
कृष्णनगर|Krishnanagar
सॉल्ट लेक|Salt Lake|Salt Lake City
बिधाननगर|Bidhannagar
राँची|Ranchi
जमशेदपुर|Jamshedpur
धनबाद|Dhanbad
बोकारो|Bokaro
बोकारो स्टील सिटी|Bokaro Steel City
देवघर|Deoghar
हज़ारीबाग|Hazaribagh|Hazaribag
रायपुर|Raipur
भिलाई|Bhilai
दुर्ग|Durg
बिलासपुर|Bilaspur
जगदलपुर|Jagdalpur
रायगढ़|Raigarh
कोरबा|Korba
राजनांदगाँव|Rajnandgaon
भोपाल|Bhopal
इंदौर|Indore
जबलपुर|Jabalpur|Jubbulpore
ग्वालियर|Gwalior
उज्जैन|Ujjain
रीवा|Rewa
सागर|Sagar
सतना|Satna
रतलाम|Ratlam
देवास|Dewas
खंडवा|Khandwa
सिंगरौली|Singrauli
छिंदवाड़ा|Chhindwara
विदिशा|Vidisha
जयपुर|Jaipur
जोधपुर|Jodhpur
उदयपुर|Udaipur
कोटा|Kota
अजमेर|Ajmer
बीकानेर|Bikaner
अलवर|Alwar
भीलवाड़ा|Bhilwara
भरतपुर|Bharatpur
सीकर|Sikar
श्रीगंगानगर|Sri Ganganagar|Shriganganagar|Sri Ganga Nagar
झुंझुनू|Jhunjhunu
पाली|Pali
चित्तौड़गढ़|Chittorgarh|Chittaurgarh
हनुमानगढ़|Hanumangarh
गांधीनगर|Gandhinagar|Gandhi Nagar
अहमदाबाद|Ahmedabad|Ahmadabad|Amdavad
वडोदरा|Vadodara|Baroda
सूरत|Surat
राजकोट|Rajkot
भावनगर|Bhavnagar
जामनगर|Jamnagar
जूनागढ़|Junagadh|Junagarh
आणंद|Anand
भरूच|Bharuch
अंकलेश्वर|Ankleshwar|Anklesvar
नवसारी|Navsari
वापी|Vapi
वलसाड|Valsad
भुज|Bhuj
मेहसाणा|Mehsana|Mahesana
मोरबी|Morbi
गोधरा|Godhra
नडियाद|Nadiad
सिलवासा|Silvassa
दमन|Daman
दीव|Diu
पणजी|Panaji|Panjim
मडगाँव|Margao|Madgaon
वास्को द गामा|Vasco da Gama
मापुसा|Mapusa
हैदराबाद|Hyderabad
सिकंदराबाद|Secunderabad
वारंगल|Warangal
हनमकोंडा|Hanamkonda|Hanmakonda
करीमनगर|Karimnagar
निज़ामाबाद|Nizamabad
खम्मम|Khammam
महबूबनगर|Mahbubnagar|Mahabubnagar
नलगोंडा|Nalgonda
सिद्दीपेट|Siddipet
विशाखापत्तनम|Visakhapatnam|Vishakhapatnam|Vishakapatnam|Vizag|Vishakhapattanam
विजयवाड़ा|Vijayawada|Vijaywada
गुंटूर|Guntur
नेल्लोर|Nellore
तिरुपति|Tirupati|Tirupathi
कुरनूल|Kurnool
कडपा|Kadapa|Cuddapah
काकीनाडा|Kakinada
राजमहेंद्रवरम|Rajamahendravaram
राजमुंदरी|Rajahmundry|Rajamundry
एलुरु|Eluru
अनंतपुर|Anantapur|Anantapuramu
ओंगोल|Ongole
श्रीकाकुलम|Srikakulam
विजयनगरम|Vizianagaram
चित्तूर|Chittoor
भीमवरम|Bhimavaram
बेंगलुरु|Bengaluru|Bangalore|Bengalore|Bangalore City
बेंगलुरु ग्रामीण|Bangalore Rural|Bengaluru Rural
बेंगलुरु शहरी|Bangalore Urban|Bengaluru Urban
मैसूर|Mysore|Mysuru
मंगलुरु|Mangalore|Mangaluru
हुबली|Hubli|Hubballi
धारवाड़|Dharwad
बेलगावी|Belagavi|Belgaum|Belgum
कलबुर्गी|Kalaburagi|Gulbarga
दावणगेरे|Davanagere|Davangere|Davengere
शिवमोग्गा|Shivamogga|Shimoga
उडुपी|Udupi
मणिपाल|Manipal
तुमकुरु|Tumakuru|Tumkur
बल्लारी|Ballari|Bellary
विजयपुरा|Vijayapura|Bijapur
रायचूर|Raichur
हासन|Hassan
कोलार|Kolar
बीदर|Bidar
बागलकोट|Bagalkot
होसपेट|Hospet|Hosapete
चेन्नई|Chennai
मद्रास|Madras
कोयंबटूर|Coimbatore
मदुरै|Madurai
तिरुचिरापल्ली|Tiruchirappalli|Trichy|Tiruchirapalli|Tiruchy
तिरुनेलवेली|Tirunelveli
तिरुप्पुर|Tiruppur|Tirupur
सेलम|Salem
इरोड|Erode
वेल्लोर|Vellore|Vellor
तंजावुर|Thanjavur|Tanjore
तूत्तुकुडी|Thoothukudi|Tuticorin
कांचीपुरम|Kanchipuram|Kancheepuram
कुड्डालोर|Cuddalore
नागरकोइल|Nagercoil
डिंडीगुल|Dindigul
करूर|Karur
होसुर|Hosur
तिरुवन्नामलै|Tiruvannamalai
तिरुवल्लूर|Tiruvallur|Thiruvallur
कन्याकुमारी|Kanyakumari
तिरुवनंतपुरम|Thiruvananthapuram|Trivandrum|Tiruvananthapuram|Thiruvanathapuram
कोच्चि|Kochi|Cochin
एर्नाकुलम|Ernakulam
कोझिकोड|Kozhikode|Calicut
त्रिशूर|Thrissur|Trichur
कोल्लम|Kollam|Quilon
कोट्टायम|Kottayam
आलप्पुषा|Alappuzha|Alleppey
पालक्काड|Palakkad|Palghat
कन्नूर|Kannur|Cannanore
मलप्पुरम|Malappuram
पेरिंथलमन्ना|Perinthalmanna|Perintalmanna
वायनाड|Wayanad
कासरगोड|Kasaragod|Kasargod
पत्तनमत्तिट्टा|Pathanamthitta
इडुक्की|Idukki
तिरुवल्ला|Tiruvalla|Thiruvalla
तोड़ुपुषा|Thodupuzha
गुवाहाटी|Guwahati|Gauhati
दिसपुर|Dispur
डिब्रूगढ़|Dibrugarh
सिलचर|Silchar
जोरहाट|Jorhat
तेज़पुर|Tezpur
नगाँव|Nagaon|Nowgong
तिनसुकिया|Tinsukia
इम्फाल|Imphal
आइज़ोल|Aizawl
शिलांग|Shillong
अगरतला|Agartala
ईटानगर|Itanagar
नाहरलागुन|Naharlagun
गंगटोक|Gangtok
कोहिमा|Kohima
दीमापुर|Dimapur
पोर्ट ब्लेयर|Port Blair
श्री विजयपुरम|Sri Vijaya Puram
कवरत्ती|Kavaratti
कराईकल|Karaikal
माहे|Mahe
यानम|Yanam
आम चौम्परा|Aam Choumpra
अबोहर|Abohar
आबू रोड|Abu Road
आचरा|Achara
आदमपुर|Adampur
अढेवाड़ा|Adhewada
आदिलाबाद|Adilabad
अडिमाली|Adimali
आदिपुर|Adipur
अग्रोहा|Agroha
अहमदगढ़|Ahmedgarh
ऐरोली|Airoli
अजनाला|Ajnala
अकबरपुर|Akbarpur
अल्मोड़ा|Almora
अमलनेर|Amalner
आमापारा|Amapara
अम्बाला छावनी|Ambala Cantt
अम्बाला शहर|Ambala City
अम्बिकापुर|Ambikapur
आम्बूर|Ambur
अमीनगाँव|Amingaon
अमरेली|Amreli
आमतला|Amtala
अंचल|Anchal
अंधेरी पश्चिम|Andheri West
अंधेरी पश्चिम, मुंबई|Andheri West, Mumbai
अंगमाली|Angamaly
आंकलाव|Anklav
अन्ना नगर|Anna Nagar|Annanagar
अन्नूर|Annur
अरगोंडा|Aragonda
आरामबाग|Arambagh
आरणी|Arani
अरंथांगी|Aranthangi
आर्कोट|Arcot
अरीकोड|Areacode
अरूकुट्टी|Arookutty
आसारीपल्लम|Asaripallam
अशोकनगर|Ashoknagar
अशोकनगर-कल्याणगढ़ कचुआ मोड़|Ashoknagarh-Kalyangarh Kachua More
अत्तापुर|Attapur
आत्तूर|Attur
औंध|Aundh
बदवेल|Badvel
बगरू|Bagru
बहादुरगढ़|Bahadurgarh
बहराइच|Bahraich
बलाचौर|Balachaur
बल्लभगढ़|Ballabgarh|Ballabhgarh
बलौदाबाज़ार|Balodabazar
बालोतरा|Balotra
बलरामपुर|Balrampur
बम्बोलिम|Bambolim
बाँदा|Banda
बाणेर|Baner
बंगा|Banga
बाँकुड़ा|Bankura
बाराबंकी|Barabanki
बरानगर|Baranagar
बड़ौत|Baraut
बारडोली|Bardoli
बरगढ़|Bargarh
बारीदुआ|Baridua
बरनाला|Barnala
बरपेटा|Barpeta
बरपेटा रोड|Barpeta Road
बरसाना|Barsana
बार्शी|Barshi
बसवेश्वरनगर|Basaveshwaranagar
बटाला|Batala
बायड|Bayad
ब्यास|Beas
बीरवाह|Beerwah
बेलापुर|Belapur
बहरमपुर|Berhampore
बेटगेरी|Betageri
बेतिया|Bettiah
बैतूल|Betul
भालेज|Bhalej
भांडुप (पश्चिम)|Bhandup (W)
भाणवड|Bhanvad
भायंदर पश्चिम|Bhayandar West
भीनमाल|Bhinmal
भिवाड़ी|Bhiwadi
भिवानी|Bhiwani
भोकर|Bhokar
भूतनाल|Bhutnal
बिहटा|Bihta
बिजनौर|Bijnor
बिसमकटक|Bissamcuttack
बोदवड़|Bodwad
बोलपुर|Bolpur
बोंगाईगाँव|Bongaigaon
बोरसद|Borsad
बुडलूर|Budalur
बडगाम|Budgam
बुलंदशहर|Bulandshahr
बूँदी|Bundi
बुरहानपुर|Burhanpur
चाकदह|Chakdaha
चाकघाट|Chakghat
चालकुडी|Chalakudy
चालीसगाँव|Chalisgaon
चल्लकेरे|Challakere
चंबा|Chamba
चंदौसी|Chandausi
चाँदपुर|Chandpur
चंद्रशेखरपुर|Chandrasekharpur
चंद्रायनगुट्टा|Chandrayangutta
चन्नपटना|Channapatna
चापडगाँव|Chapadgaon
चरखी दादरी|Charkhi Dadri
चेंगलपट्टू|Chengalpattu
चेंगन्नूर|Chengannur
चेर्पू|Cherpu
चेर्तला|Cherthala
चेट्टीकुलम|Chettikulam
चेवेल्ला|Chevella
चिनकाकानी|Chinakakani
चिंचवड़|Chinchwad
चिंतामणि|Chintamani
चीराला|Chirala
चित्रदुर्ग|Chitradurga
चुट्टीपारा|Chuttipara
कोडक्कल|Codacal
कूचबिहार|Cooch Behar|Coochbehar
कुन्नूर|Coonoor
कंबम|Cumbum
दादरी|Dadri
दहिसर पश्चिम|Dahisar West
दाहोद|Dahod
दाखा|Dakha
दल्ली राजहरा|Dalli Rajhara
डानकुनी चंडीतला|Dankuni Chanditala
डेबरा|Debra
देवली|Deoli
डेरा बस्सी|Dera Bassi
देऊलगाँव राजा|Deulgaon Raja
देऊर बीके|Deur Bk.--
देवकोट्टई|Devakottai
धामपुर|Dhampur
धार|Dhar
धारगल|Dhargal
धर्मपुरी|Dharmapuri
धर्मवरम|Dharmavaram
धौलपुर|Dholpur
धुबरी|Dhubri
धूरी|Dhuri
डायमंड हार्बर|Diamond Harbour
डोंबिवली पूर्व|Dombivli East
डोना पाउला|Dona Paula
दोराहा|Doraha
दुमका|Dumka
दुर्गापुर एबीएल टाउनशिप|Durgapur Abl Township
एडप्पल्ली|Edappally
एडरिकोड|Edarikode
फलता|Falta
फ़रीदकोट|Faridkot
फ़र्रुख़ाबाद|Farrukhabad
फ़तेहपुर|Fatehpur
गाडरवारा|Gadarwara
गगरेट|Gagret
गायघाट|Gaighat
गणपति|Ganapathy
गांधीधाम|Gandhidham
गढ़वा|Garhwa
जॉर्ज टाउन|George Town
घरौंडा|Gharunda
घाटकोपर पश्चिम|Ghatkopar West
घाटलोडिया|Ghatlodiya
गिरिडीह|Giridih
गोंडा|Gonda
गोंडल|Gondal
गोपालगंज|Gopalganj
गोपालगढ़|Gopalgarh
गोरेगाँव (पूर्व)|Goregaon (E)
गोरेगाँव पश्चिम|Goregaon West
गोज़ारिया|Gozaria
ग्रेटर नोएडा पश्चिम|Greater Noida West
ग्रीन पार्क|Green Park
गुरुवायूर|Guruvayoor
गुटकर|Gutkar
हडपसर|Hadapsar
हैलाकांडी|Hailakandi
हालोल|Halol
हलवद|Halvad
हंदवाड़ा|Handwara
हाँसी|Hansi
हरिपाड|Haripad
हरबर्टपुर|Herbertpur
हिलसा|Hilsa
हिम्मतनगर|Himatnagar
होडल|Hodal
होशंगाबाद|Hoshangabad
इचलकरंजी|Ichalkaranji|Ichalkuranji
इंदिरापुरम|Indirapuram
इरिंजालकुडा|Irinjalakuda
इरिट्टी|Iritty
इस्लामपट्टी नगाँव|Islampaty Nagaon
इस्लामपुर|Islampur
जगाधरी|Jagadhri
जगतियाल|Jagtial
जैसलमेर|Jaisalmer
जालंधर छावनी|Jalandhar Cant
जालंधर शहर|Jalandhar City
जालना|Jalna
जलपाईगुड़ी|Jalpaiguri
जनकपुरी|Janakpuri
जपला|Japla
झज्जर|Jhajjar
झालावाड़|Jhalawar
जिया कुल्लू|Jia Kullu
जींद|Jind
जोधपुर शहर|Jodhpur City
ज्वालापुर|Jwalapur
काबिलपोर|Kabilpore
कडक्कल|Kadakkal
कडी|Kadi
काडुगोडी|Kadugodi
कैलाश कॉलोनी|Kailash Colony
कैथल|Kaithal
कलंबोली|Kalamboli
कालापेट|Kalapet
कालीघाट|Kalighat
कालिम्पोंग|Kalimpong
कालकाजी|Kalkaji
कल्लाई|Kallai
कलपेट्टा|Kalpetta
कलवा|Kalwa
कल्याण शहर|Kalyan City
कल्याणी|Kalyani
कामोठे|Kamothe
कामरूप महानगर|Kamrup Metro
कामशेत|Kamshet
कंडेला|Kandela
काँगड़ा, टांडा|Kangra At Tanda
कान्हंगाड|Kanhangad
कांके|Kanke
कनखल|Kankhal
कानपुर नगर|Kanpur Nagar
कपूरथला|Kapurthala
कराड|Karad
कराड शहर|Karad City
करिमुगल|Karimugal
कड़कड़डूमा|Karkardooma
करुकुट्टी|Karukutty
करुनागप्पल्ली|Karunagappally
कस्बा नारायणगढ़|Kasba Narayangarh
कासगंज|Kasganj
कटनी|Katni
कटरा|Katra
कट्टांकुलत्तूर|Kattankulathur
कट्टप्पना|Kattappana
कवर्धा|Kawardha
कज़क्कूट्टम|Kazhakuttam
केलंबाक्कम|Kelambakkam
केंगेरी|Kengeri
खागा|Khaga
खगड़िया|Khagaria
खंभालिया|Khambhalia
खानापुरम हवेली|Khanapuram Haweli
खन्ना|Khanna
खरड़|Kharar
खारघर|Kharghar
खरोद|Kharod
खेड़ा|Kheda
कोडीनार|Kodinar
कोडुंगल्लूर|Kodungallur
कोजरा|Kojra
कोलत्तूर|Kolathur
कोलेंचेरी|Kolenchery
कोल्लेंगोड|Kollengode
कोम्पल्ली|Kompally
कोंगाड|Kongad
कोन्नगर|Konnagar
कोपरगाँव|Kopargaon
कोठापेटा|Kotha Peta
कोतमंगलम|Kothamangalam
कोटपूतली|Kotputli
कोट्टक्कल|Kottakkal
कोट्टियम|Kottiyam
कोवलम|Kovalam
कोझेनचेरी|Kozhencherry
कृष्णगिरि|Krishnagiri
कुकटपल्ली|Kukatpally
कुलत्तुपुझा|Kulathupuzha
कुल्लू|Kullu
कुंडरा|Kundara
कुन्नमकुलम|Kunnamkulam
कुरुडा|Kuruda
कुरुक्षेत्र|Kurukshetra
लहेरियासराय|Laheriasarai
लखनपुर|Lakhanpur
लोणंद|Lonand
लुधियाना-1|Ludhiana-1
लूणावाड़ा|Lunawada
लुंगलेई|Lunglei
मछलीपट्टनम|Machilipatnam
मदनपल्ले|Madanapalle
माढा|Madha
माधापुर|Madhapur
मदुरै पूर्व|Madurai East
महालुंग|Mahalung
महाराजगंज|Maharajganj
महासमुंद|Mahasamund
माल बाज़ार|Mal Bazar
माला|Mala
मलाड पूर्व|Malad East
मलाड पश्चिम|Malad West
मलकानगिरि|Malkangiri
मल्लप्पल्ली|Mallappally
मल्लिकार्जुनपेट|Mallikarjunpet
मनमेलकुडी|Manamelkudi
मनासा|Manasa
मंचेरियल|Mancherial
मंडुआडीह|Mandaudih
मंडी गोबिंदगढ़|Mandi Gobindgarh
मंड्या|Mandya
मानेसर|Manesar
मंगलवेढ़ा|Mangalwedha
मंजेरी केएलए|Manjeri Kla
मन्नारक्काड|Mannarkkad
मानसा|Mansa
मराडु|Maradu
मारिया पुरम|Maria Puram
मेरठ छावनी|Meerut Cantt
मेट्टुपालयम-कोयंबटूर|Mettupalayam-Coimbatore
मेट्टूर|Mettur
मेदिनीपुर|Midnapore
मीरा रोड (पूर्व), ठाणे|Mira Road (East), Thane
मिरज|Miraj
मॉडल टाउन जालंधर|Model Town Jalandhar
मोदीनगर|Modinagar
मोगरा|Mogra
मोइनाबाद|Moinabad
मोकोकचुंग|Mokokchung
मोड़क|Morak
मोरीगाँव|Morigaon
मुबारकपुर मु. नासिरपु|Mubarakpur Mu. Nasirpu
मुक्तसर|Muktsar
मुलुंड (पश्चिम)|Mulund (W)
मुलुंड पश्चिम|Mulund West
मुंब्रा|Mumbra
मुंगेली|Mungeli
मुरिक्कास्सेरी डाकघर|Murickassery Post
मुर्शिदाबाद|Murshidabad
मूवाट्टुपुझा|Muvattupuzha
नादापुरम|Nadapuram
नजफ़गढ़|Najafgarh
नजीबाबाद|Najibabad
नालंदा|Nalanda
नलबाड़ी|Nalbari
नामक्कल|Namakkal
नंदीवरम-गुडुवांचेरी|Nandivaram-Guduvancheri
नरेला|Narela
नारनौल|Narnaul
नरसीपट्टनम|Narsipatnam
नाथद्वारा|Nathdwara
नौगढ़|Naugarh
नवरंगपुरा|Navrangpura
नवादा|Nawada
नाज़रेथ|Nazareth
नेब सराय|Neb Sarai
नेडुमंगाड|Nedumangad
नेर चौक|Ner Chowk
नेरुल|Nerul
नेसवड|Nesvad
नया पनवेल पूर्व|New Panvel East
नीमराना|Nimrana
नुल्लीपाडी|Nullipady
नुंगमबक्कम|Nungambakkam
नूरमहल|Nurmahal
ऊटी|Ooty
पधर|Padhar
पडरौना|Padrauna
पालाई|Palai
पालमपुर|Palampur
पालनपुर|Palanpur
पालयमकोट्टई|Palayamkottai
पालीगंज|Paliganj
पालकोट|Palkot
पलवल|Palwal
पंदलम|Pandalam
पंढरपुर|Pandharpur
पावटा - जोधपुर|Paota - Jodhpur
परभणी|Parbhani
परुमला|Parumala
पश्चिम विहार|Paschim Vihar
पाटन|Patan
पटानचेरु|Patancheru
पाटस|Patas
पत्तनापुरम|Pathanapuram
पाटपुर|Patpur
पावारट्टी|Pavaratty
पय्यानूर|Payyanur
पेडगाँव|Pedgaon
पेरुम्बावूर|Perumbavoor
पेरुन्दुरै|Perundurai
फगवाड़ा|Phagwara
पीलीभीत|Pilibhit
पिपिली|Pipili
पिथौरागढ़|Pithoragarh
पूलाकोड|Poolacode
पोरबंदर|Porbandar
प्रोद्दटूर|Proddatur
पुदुक्कोट्टई|Pudukottai
पुक्काट्टुपडी|Pukkattupady
पुलिक्कल|Pulikkal
पुलियंगुडी|Puliyangudi
पुलवामा|Pulwama
पुनलूर|Punalur
पूर्व बर्धमान|Purba Bardhaman
पुरुलिया|Purulia
पुसेगाँव|Pusegaon
पुत्तूर|Puthur
पुट्टपर्थी|Puttaparthi
पुत्तूर शहर|Puttur Town
रायगंज|Raiganj
रायकोट|Raikot
रायसेन|Raisen
राजपालयम|Rajapalaiyam|Rajapalayam
राजारहाट|Rajarhat
राजगढ़|Rajgarh
राजपुरा|Rajpura
राजपुरा शहर|Rajpura Town
रामनाथपुरम|Ramanathapuram
रामचंद्रपुर|Ramchandrapur
रामपुर|Rampur
रामपुरा फूल|Rampura Phul
रामपुरहाट|Rampurhat
राणावास|Ranawas
रानीपेट|Ranipet
रासिपुरम|Rasipuram
आरएयू पूसा|Rau Pusa
रावेत|Ravet
आरएस पुरम|Rs Puram
रूपनगर|Rupnagar
सफदरजंग डेवलपमेंट एरिया|Safdarjung Development Area
साहनेवाल|Sahnewal
साक्री|Sakri
सामलकोट|Samalkot
संभल|Sambhal
समराला|Samrala
सांकतोड़िया|Sanctoria
संगमनेर|Sangamner
संगारेड्डी|Sangareddy
संतरामपुर|Santrampur
सावली|Savli
सवाई माधोपुर|Sawai Madhopur
सावंगी|Sawangi
सायट|Sayat
सीहोर|Sehore
श्रीरामपुर|Serampore
शादनगर|Shadnagar
शाहाबाद मारकंडा|Shahabad Markanda
शहापुर|Shahapur
शहडोल|Shahdol
शिलफाटा|Shilphata
शिरालकोप्पा|Shiralakoppa
शिर्डी|Shirdi
शिवाजी नगर|Shivaji Nagar
श्रीगोंदा|Shrigonda
श्यामनगर|Shyamnagar
सिद्धपुर|Siddhpur
सिंधनूर|Sindhanur
सिन्नर|Sinnar
सायन|Sion
सिरोही|Sirohi
सिरसी|Sirsi
शिवगंगा|Sivagangai
सिवाना|Siwana
सोदपुर|Sodepur
सोनगढ़|Songadh
दक्षिण गोवा|South Goa
श्री मुक्तसर साहिब|Sri Muktsar Sahib
श्रीपेरुम्बुदूर|Sriperumbudur
सुल्लिया|Sullia
सुमेरपुर|Sumerpur
सूरमपट्टी|Surampatti
सुरेंद्रनगर|Surendranagar
स्वामियारमडम|Swamiyarmadam
तलाजा|Talaja
तांबरम|Tambaram
तांबर|Tamber
तरन तारन|Tarn Taran
तेनाली|Tenali
तेनकासी|Tenkasi
तलश्शेरी|Thalassery
ठाणे पश्चिम|Thane West
तेनी|Theni
तुरैयूर|Thuraiyur
तैक्काड|Thycaud
तिलक नगर|Tilak Nagar
तिरुचेंदूर|Tiruchendur
तिरुक्कोइलूर|Tirukkoyilur
तिरुनेलवेली जंक्शन|Tirunelveli Junction
तिरुपादिरिपुलियूर|Tirupadiripuliyur
त्यूणी|Tiuni
त्रिकुटा नगर|Trikuta Nagar
त्र्यंबक|Trimbak
तुरा|Tura
तुरुवेकेरे|Turuvekere
उचगाँव|Uchgaon
उदालगुड़ी|Udalguri
उदगीर|Udgir
उडुमलपेट|Udumalpet
उल्लियेरी|Ulliyeri
उलुंदूरपेट|Ulundurpet
उलवे|Ulwe
उमेराबाद|Umerabad
उमरेठ|Umreth
उन्नाव|Unnao
उड़मुड़ टांडा|Urmar Tanda
उत्तम नगर|Uttam Nagar
उत्तरपाड़ा|Uttarpara
वडपलानी|Vadapalani
वैकोम|Vaikom
वैशाली|Vaishali
वलांचेरी|Valancheri
वल्लियूर|Vallioor
वाणियम्बाडी|Vaniyambadi
वाणियमकुलम|Vaniyamkulam
वर्तूर|Varthur
वसई पूर्व|Vasai East
वसई रोड पश्चिम|Vasai Road West
वेमगल|Vemagal
विरार पश्चिम|Virar West
विरुधुनगर|Virudhunagar
विश्रांतवाड़ी|Vishrantwadi
विसनगर|Visnagar
विटा|Vita
व्यारा|Vyara
वाई|Wai
वाकड|Wakad
वनपर्ती|Wanaparthy
वांकानेर|Wankaner
वाशिम|Washim
येम्मिगनूर|Yemmiganur
यरवडा|Yerawada
येर्रमुक्कपल्ली|Yerramukkapalli
ज़ीरकपुर|Zirakpur
अकलूज|Akluj
चाकण|Chakan
सुल्तानपुर लोधी|Sultanpur Lodhi
उत्तर लखीमपुर|North Lakhimpur
अल्लीनगरम|Allinagaram
निगडी|Nigdi
पोल्लाची|Pollachi
अंजार|Anjar
काशीपुर|Kashipur
साहिबाबाद|Sahibabad
कांदिवली पश्चिम|Kandivali West
ढालपुर|Dhalpur
किशनगढ़|Kishangarh
डीसा|Deesa
मुंद्रा|Mundra
नकोदर|Nakodar
तलवंडी साबो|Talwandi Sabo
रोहिणी|Rohini
जंबूसर|Jambusar
काल्हेर|Kalher
मार्तंडम|Marthandam
बनरपाल|Banarpal
शिवकाशी|Sivakasi
नैनी|Naini
नागोल|Nagole
थराद|Tharad
शिरोल|Shirol
सांबा|Samba
भुसावल|Bhusawal
रोपड़|Ropar
हरदोई|Hardoi
मणिनगर|Maninagar
विल्लुपुरम|Villupuram
कुर्ला|Kurla
रामगढ़ भुल्लर|Ramgarh Bhullar
मांडवी|Mandvi
होजाई|Hojai
सायला|Sayla
छतरपुर|Chhatarpur
रॉयपुरम|Royapuram
अंधेरी पूर्व|Andheri East
गदग|Gadag
कोरेगाँव|Koregaon
निलंगा|Nilanga
चंगनाश्शेरी|Changanacherry|Changanassery
पिहोवा|Pehwa
पीतमपुरा|Pitampura
मेट्टुपालयम|Mettupalayam
तारकेश्वर|Tarakeswar
अनकापल्ली|Anakapalle
कलोल|Kalol
अनूपपुर|Anuppur
रमन|Raman
उस्मानाबाद|Osmanabad
अमलोह|Amloh
शेखपुरा|Sheikhpura
पासीघाट|Pasighat
तिरुवोट्टियूर|Thiruvottiyur
बरवाला|Barwala
बालापुर|Balapur
महू|Mhow
तिरुनेलवेली|Tirunelvei
सादाबाद|Sadabad
मुकेरियाँ|Mukerian
मालोम तुलियाइमा|Malom Tuliyaima
कुंदापुरा|Kundapura
नकुड़|Nakur
नामची|Namchi
तमोलिया|Tamolia
पट्टी|Patti
बहालगढ़|Bahalgarh
घनसावंगी|Ghansawangi
उदवाड़ा|Udvada
फ़ैज़ाबाद|Faizabad
मनप्पारै|Manapparai
गोरवा|Gorwa
मालपुरा|Malpura
महाभैरब|Mahabhairab
चेन्निमलै|Chennimalai
बीड|Beed
काकोरी|Kakori
जामताड़ा|Jamtara
हडाला भाल|Hadala Bhal
मालवीय नगर|Malviya Nagar
कोंडापुर|Kondapur
अमिंजिकरै चेन्नई|Aminjikarai Chennai
जालंधर पूर्व|Jalandhar-East
नगर|Nagar
बुलढाणा|Bhuldhana
रामापुरम|Ramapuram
क्रोमपेट|Chrompet
ईराट्टुपेट्टा|Erattupetta
कुट्टालम|Kuttalam
बिदरी|Bidri
`.trim();

const keyOf = value => String(value).trim().toLowerCase().normalize("NFC").replace(/&/g, " and ").replace(/[.\s_-]+/g, " ").trim();
const names = new Map();
for (const row of spellings.split("\n")) {
  const [hindi, ...english] = row.split("|");
  for (const variant of english) names.set(keyOf(variant), hindi);
}

const placeWordsHi = new Map(Object.entries({
  "new":"न्यू", "old":"ओल्ड", "north":"उत्तर", "south":"दक्षिण", "east":"पूर्व", "west":"पश्चिम",
  "central":"मध्य", "rural":"ग्रामीण", "urban":"शहरी", "city":"शहर", "town":"शहर", "district":"ज़िला",
  "nagar":"नगर", "bazar":"बाज़ार", "bazaar":"बाज़ार", "road":"रोड", "colony":"कॉलोनी",
  "village":"गाँव", "post":"डाकघर", "junction":"जंक्शन", "sector":"सेक्टर", "cantt":"छावनी",
  "sri":"श्री", "shri":"श्री", "ram":"राम", "raj":"राज", "ganj":"गंज", "garh":"गढ़", "pur":"पुर",
  "shyam":"श्याम", "shah":"शाह", "gopal":"गोपाल", "lakshmi":"लक्ष्मी", "laxmi":"लक्ष्मी", "krishna":"कृष्ण"
}));

// A Roman place name need not encode all of its vowels. Use a conventional
// spelling above when known; otherwise render a phonetic reading of the supplied name.
const consonants = {
  chh:"छ", ch:"च", sh:"श", zh:"ळ", kh:"ख", gh:"घ", jh:"झ", th:"थ", dh:"ध",
  ph:"फ", bh:"भ", ny:"न्य", shh:"ष", ksh:"क्ष", tr:"त्र", shr:"श्र",
  k:"क", g:"ग", c:"क", j:"ज", t:"त", d:"द", n:"न", p:"प", b:"ब",
  m:"म", y:"य", r:"र", l:"ल", v:"व", w:"व", s:"स", h:"ह", f:"फ़",
  z:"ज़", q:"क़", x:"क्स"
};
const vowels = {
  aa:["आ","ा"], ee:["ई","ी"], ii:["ई","ी"], oo:["ऊ","ू"], uu:["ऊ","ू"],
  ai:["ऐ","ै"], au:["औ","ौ"], ou:["औ","ौ"],
  a:["अ",""], i:["इ","ि"], u:["उ","ु"], e:["ए","े"], o:["ओ","ो"]
};
const romanUnits = /chh|ksh|shr|shh|ch|sh|zh|kh|gh|jh|th|dh|ph|bh|ny|tr|aa|ii|ee|oo|uu|ai|au|ou|[a-z]/g;

function phoneticWord(word) {
  const key = keyOf(word);
  const known = names.get(key) || placeWordsHi.get(key);
  if (known) return known;
  // Common compound endings are syllables, not consonant clusters at the
  // join: in "Ramnagar" the m and n belong to different words.
  const compound = key.match(/^([a-z]{2,})(nagar|ganj|garh|pur)$/);
  if (compound) return phoneticWord(compound[1]) + placeWordsHi.get(compound[2]);
  let result = "", previousConsonant = false;
  const units = key.match(romanUnits) || [];
  for (const [index, unit] of units.entries()) {
    if (Object.hasOwn(vowels, unit)) {
      const final = index === units.length - 1;
      const forms = unit === "a" && final ? vowels.aa : unit === "i" && final ? vowels.ii : vowels[unit];
      result += forms[previousConsonant ? 1 : 0];
      previousConsonant = false;
    } else {
      result += (previousConsonant ? "्" : "") + consonants[unit];
      previousConsonant = true;
    }
  }
  return result;
}

export function administrativeNameHindi(value) {
  const original = String(value ?? "").trim();
  const known = names.get(keyOf(original));
  if (known) return known;
  // This is called only with a structured administrative field. Keep digits,
  // punctuation, PINs and existing Devanagari exactly as recorded.
  return original.replace(/[A-Za-z]+/g, phoneticWord);
}

export function cityStateLabel(city, state, language = "en") {
  const parts = [city, state].filter(Boolean);
  return (language.startsWith("hi") ? parts.map(administrativeNameHindi) : parts).join(", ");
}
