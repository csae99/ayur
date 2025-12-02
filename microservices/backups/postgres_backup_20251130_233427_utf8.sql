--
-- PostgreSQL database dump
--

\restrict b5Ypciic7V1V6mOOPLCkjjj3d1BbyS1djABD1XM1sev2PCtq1t6KzRkXrmgBH7A

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.addresses (
    id integer NOT NULL,
    user_id integer NOT NULL,
    full_name character varying(255) NOT NULL,
    street character varying(255) NOT NULL,
    city character varying(255) NOT NULL,
    state character varying(255) NOT NULL,
    zip character varying(255) NOT NULL,
    phone character varying(255) NOT NULL,
    is_default boolean DEFAULT false
);


ALTER TABLE public.addresses OWNER TO "user";

--
-- Name: addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.addresses_id_seq OWNER TO "user";

--
-- Name: addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.addresses_id_seq OWNED BY public.addresses.id;


--
-- Name: admins; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    firstname character varying(100) NOT NULL,
    lastname character varying(100) NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    status character varying(100) DEFAULT 'active'::character varying,
    joined_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admins OWNER TO "user";

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.admins_id_seq OWNER TO "user";

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    practitioner_id integer NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    status character varying(255) DEFAULT 'Pending'::character varying,
    notes text,
    created_at timestamp with time zone
);


ALTER TABLE public.appointments OWNER TO "user";

--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.appointments_id_seq OWNER TO "user";

--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    cart_id integer NOT NULL,
    item_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    added_at timestamp with time zone
);


ALTER TABLE public.cart_items OWNER TO "user";

--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cart_items_id_seq OWNER TO "user";

--
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- Name: carts; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.carts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.carts OWNER TO "user";

--
-- Name: carts_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.carts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.carts_id_seq OWNER TO "user";

--
-- Name: carts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.carts_id_seq OWNED BY public.carts.id;


--
-- Name: items; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.items (
    id integer NOT NULL,
    item_title character varying(255) NOT NULL,
    item_brand character varying(255) NOT NULL,
    item_cat character varying(255) NOT NULL,
    item_details text NOT NULL,
    item_tags character varying(255) NOT NULL,
    item_image character varying(255) NOT NULL,
    item_quantity integer NOT NULL,
    item_price integer NOT NULL,
    added_by character varying(100),
    status character varying(20) DEFAULT 'Pending'::character varying
);


ALTER TABLE public.items OWNER TO "user";

--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.items_id_seq OWNER TO "user";

--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    item_id integer NOT NULL,
    user_id integer NOT NULL,
    order_quantity integer NOT NULL,
    order_date date NOT NULL,
    order_status integer DEFAULT 1 NOT NULL,
    address_id integer,
    tracking_number character varying(255),
    shipped_date timestamp with time zone,
    delivered_date timestamp with time zone,
    estimated_delivery date,
    practitioner_id integer
);


ALTER TABLE public.orders OWNER TO "user";

--
-- Name: COLUMN orders.order_status; Type: COMMENT; Schema: public; Owner: user
--

COMMENT ON COLUMN public.orders.order_status IS '0=PendingPayment, 1=Confirmed, 2=Processing, 3=Packed, 4=Shipped, 5=OutForDelivery, 6=Delivered, 7=Cancelled, 8=Returned, 9=Refunded';


--
-- Name: COLUMN orders.practitioner_id; Type: COMMENT; Schema: public; Owner: user
--

COMMENT ON COLUMN public.orders.practitioner_id IS 'ID of the practitioner/pharmacy who sold the item';


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.orders_id_seq OWNER TO "user";

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.patients (
    id integer NOT NULL,
    fname character varying(50) NOT NULL,
    lname character varying(50) NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    profile character varying(255),
    address character varying(255),
    joined_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.patients OWNER TO "user";

--
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.patients_id_seq OWNER TO "user";

--
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;


--
-- Name: practitioners; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.practitioners (
    id integer NOT NULL,
    fname character varying(255) NOT NULL,
    lname character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    office_name character varying(255),
    address character varying(255),
    profile character varying(255),
    professionality character varying(255),
    bio text,
    nida character varying(50),
    businesslicense character varying(255),
    facebook character varying(255),
    twitter character varying(255),
    license character varying(255),
    verified boolean DEFAULT false,
    is_new boolean DEFAULT true,
    role character varying(50) DEFAULT 'user'::character varying,
    joined_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.practitioners OWNER TO "user";

--
-- Name: practitioners_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.practitioners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.practitioners_id_seq OWNER TO "user";

--
-- Name: practitioners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.practitioners_id_seq OWNED BY public.practitioners.id;


--
-- Name: addresses id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- Name: carts id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts ALTER COLUMN id SET DEFAULT nextval('public.carts_id_seq'::regclass);


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: patients id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- Name: practitioners id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.practitioners ALTER COLUMN id SET DEFAULT nextval('public.practitioners_id_seq'::regclass);


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.addresses (id, user_id, full_name, street, city, state, zip, phone, is_default) FROM stdin;
1	2	Amit Test	123 Test St	Test City	TS	12345	1234567890	f
2	8	Test User	123 Main St	Mumbai	MH	400001	9876543210	f
3	1	patient_user	L street	pune	maharashtra	412309	698696658998	f
\.


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.admins (id, firstname, lastname, username, password, status, joined_on) FROM stdin;
1	Super	Admin	admin_user	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	active	2025-11-22 13:20:38.767
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.appointments (id, patient_id, practitioner_id, date, "time", status, notes, created_at) FROM stdin;
1	1	1	2025-11-28	12:00:00	Cancelled	need soln	2025-11-23 18:05:36.45+00
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.cart_items (id, cart_id, item_id, quantity, added_at) FROM stdin;
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.carts (id, user_id, created_at, updated_at) FROM stdin;
1	2	2025-11-29 04:08:16.898+00	2025-11-29 04:08:16.908+00
2	8	2025-11-29 09:26:14.475+00	2025-11-29 09:26:14.491+00
3	1	2025-11-30 07:26:24.063+00	2025-11-30 07:26:24.066+00
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.items (id, item_title, item_brand, item_cat, item_details, item_tags, item_image, item_quantity, item_price, added_by, status) FROM stdin;
2	Globulus	Globulus	medicine	Treats skin infections and other skin disorders	skin, infection	med2.jpg	100	200	\N	Pending
3	Aristata	Aristata	medicine	Treats both scabiies and other skin infections in the body.	scabies, skin	med3.webp	100	99	\N	Pending
4	Test Med	Test Brand	Herbs	Details	tag	img.png	100	100	\N	Pending
5	ayur-med1	prac-1	Herbs for Health	help to relieve pain	pan-relief	Medicine.png	100	996	\N	Pending
6	ayur-med1	prac-1	Herbs for Health	pain relief	pan-relief	Medicine.png	100	996	\N	Pending
7	ayur-med1	prac-1	Herbs for Health	pain relief	pan-relief	Medicine.png	100	996	\N	Pending
8	ayur-med1	prac-1	Herbs for Health	pain relief	pan-relief	Medicine.png	100	996	\N	Pending
9	ayur-med101	prac-1	Herbs for Health	pain-relief	pan-relief	Medicine.png	100	996	\N	Pending
11	Ashwagandha Capsules	Himalaya	Herbs for Health	Premium quality Ashwagandha for stress relief and energy boost. Contains 500mg of pure extract per capsule.	stress, energy, immunity	Medicine.png	100	299	dr_rajesh	Approved
12	Triphala Churna	Patanjali	Herbs for Health	Traditional Ayurvedic digestive powder made from three fruits. Helps in detoxification and digestion.	digestion, detox, immunity	Medicine.png	100	150	dr_rajesh	Approved
13	Chyawanprash	Dabur	Herbs for Health	Complete immunity booster with 40+ herbs. Suitable for all ages. Rich in Vitamin C and antioxidants.	immunity, energy, wellness	Medicine.png	100	450	dr_priya	Approved
14	Kumkumadi Tailam	Kama Ayurveda	Skin Infections	Luxurious face oil for glowing skin. Contains saffron and other precious herbs. Reduces dark spots.	skincare, beauty, glow	Medicine.png	100	1200	dr_priya	Approved
15	Brahmi Tablets	Organic India	Herbs for Health	Brain tonic for memory and concentration. 100% organic Brahmi extract with no additives.	memory, focus, brain	Medicine.png	100	350	dr_arun	Approved
16	Neem Capsules	Himalaya	Skin Infections	Pure Neem extract for blood purification and skin health. Helps in treating acne and infections.	skincare, blood purifier, detox	Medicine.png	100	250	dr_meera	Pending
17	Garcinia Cambogia	HealthVit	Weight Loss	Natural weight loss supplement with HCA. Helps suppress appetite and boost metabolism.	weight loss, metabolism, fat burner	Medicine.png	100	599	dr_vikram	Pending
18	Guggul Tablets	Zandu	Weight Loss	Ayurvedic herb for cholesterol management and weight loss. Supports healthy lipid levels.	weight loss, cholesterol, heart health	Medicine.png	100	399	dr_anita	Pending
19	Tulsi Drops	Organic India	Herbs for Health	Holy Basil extract for immunity and respiratory health. Anti-stress and adaptogenic properties.	immunity, respiratory, stress	Medicine.png	100	180	dr_karthik	Pending
20	Arjuna Extract	Sri Sri Tattva	Other	Heart care supplement. Supports cardiovascular health and maintains healthy blood pressure.	heart, blood pressure, cardiovascular	Medicine.png	100	450	dr_meera	Pending
21	Magic Weight Loss Tea	Unknown Brand	Weight Loss	Instant weight loss tea with guaranteed results in 7 days.	weight loss, quick fix	Medicine.png	100	99	dr_vikram	Rejected
22	Super Power Capsules	Generic	Other	Increases energy and stamina 10x instantly.	energy, power	Medicine.png	100	199	dr_anita	Rejected
1	Cilliata	Cilliata	medicine	I treats fever and ulcers plus general health of body	fever, ulcers, health	med1.webp	100	70	\N	Rejected
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.orders (id, item_id, user_id, order_quantity, order_date, order_status, address_id, tracking_number, shipped_date, delivered_date, estimated_delivery, practitioner_id) FROM stdin;
1	1	1	1	2024-04-09	0	\N	\N	\N	\N	\N	\N
2	2	1	1	2024-04-09	0	\N	\N	\N	\N	\N	\N
3	1	2	2	2024-04-10	0	\N	\N	\N	\N	\N	\N
4	3	2	1	2024-04-10	1	\N	\N	\N	\N	\N	\N
7	3	1	1	2025-11-22	0	\N	\N	\N	\N	\N	\N
9	2	1	1	2025-11-21	0	\N	\N	\N	\N	\N	\N
10	3	1	3	2025-11-22	0	\N	\N	\N	\N	\N	\N
12	2	2	1	2025-11-29	1	1	\N	\N	\N	\N	\N
14	2	2	1	2025-11-29	1	1	\N	\N	\N	2025-12-04	\N
15	2	8	1	2025-11-29	7	2	\N	\N	\N	2025-12-04	\N
8	1	1	2	2025-11-20	7	\N	\N	\N	\N	\N	\N
5	2	1	3	2024-04-10	7	\N	\N	\N	\N	\N	\N
13	2	2	1	2025-11-29	4	1	ASD12357	2025-11-30 06:29:53.491+00	\N	2025-12-04	\N
16	12	1	4	2025-11-30	1	3	\N	\N	\N	2025-12-05	\N
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.patients (id, fname, lname, username, password, email, phone, profile, address, joined_on) FROM stdin;
1	John	Doe	patient_user	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	patient@example.com	1234567890	\N	123 Patient St	2025-11-22 13:20:38.561
2	Amit	Verma	amit_v	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	amit@example.com	9123456780	\N	Delhi, India	2025-11-23 06:27:31.164612
3	Sneha	Kapoor	sneha_k	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	sneha@example.com	9123456781	\N	Mumbai, India	2025-11-23 06:27:31.164612
4	Rahul	Mehta	rahul_m	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	rahul@example.com	9123456782	\N	Bangalore, India	2025-11-23 06:27:31.164612
5	Pooja	Nair	pooja_n	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	pooja@example.com	9123456783	\N	Chennai, India	2025-11-23 06:27:31.164612
6	Arjun	Rao	arjun_r	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	arjun@example.com	9123456784	\N	Hyderabad, India	2025-11-23 06:27:31.164612
7	Kavya	Prasad	kavya_p	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	kavya@example.com	9123456785	\N	Pune, India	2025-11-23 06:27:31.164612
8	Test	Patient	test_patient_01	$2b$10$r53dlVj3ds2NSCcV/WK0au6kJnNJifKBaBrhhmllx6oajTIFGPX92	test_patient_01@example.com	9876543210	\N	123 St, City, State, 123456	2025-11-29 09:19:53.695
\.


--
-- Data for Name: practitioners; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.practitioners (id, fname, lname, username, password, email, phone, office_name, address, profile, professionality, bio, nida, businesslicense, facebook, twitter, license, verified, is_new, role, joined_on) FROM stdin;
1	Jane	Smith	practitioner_user	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	practitioner@example.com	0987654321	Smith Clinic	456 Healer Ave	\N	Ayurveda	\N	\N	\N	\N	\N	\N	t	t	user	2025-11-22 13:20:38.742
3	Dr. Rajesh	Sharma	dr_rajesh	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	rajesh@ayurveda.com	9876543210	Sharma Ayurvedic Clinic	Mumbai, Maharashtra	\N	Ayurvedic Physician	Specialized in Panchakarma therapy with 15 years experience	1234567890	\N	\N	\N	\N	t	t	user	2025-11-23 06:27:31.088587
4	Dr. Priya	Patel	dr_priya	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	priya@ayurveda.com	9876543211	Patel Wellness Center	Ahmedabad, Gujarat	\N	Ayurvedic Consultant	Expert in herbal medicine and dietary consultation	1234567891	\N	\N	\N	\N	t	t	user	2025-11-23 06:27:31.088587
5	Dr. Arun	Kumar	dr_arun	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	arun@ayurveda.com	9876543212	Kumar Ayurvedic Hospital	Bangalore, Karnataka	\N	Senior Ayurvedic Doctor	Specializing in chronic disease management	1234567892	\N	\N	\N	\N	t	t	user	2025-11-23 06:27:31.088587
6	Dr. Meera	Reddy	dr_meera	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	meera@ayurveda.com	9876543213	Reddy Ayurvedic Clinic	Hyderabad, Telangana	\N	Ayurvedic Practitioner	Focus on skin and hair care treatments	1234567893	\N	\N	\N	\N	f	t	user	2025-11-23 06:27:31.14763
7	Dr. Vikram	Singh	dr_vikram	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	vikram@ayurveda.com	9876543214	Singh Wellness Spa	Jaipur, Rajasthan	\N	Ayurvedic Therapist	Specialized in stress management and rejuvenation	1234567894	\N	\N	\N	\N	f	t	user	2025-11-23 06:27:31.14763
8	Dr. Anita	Desai	dr_anita	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	anita@ayurveda.com	9876543215	Desai Ayurvedic Center	Pune, Maharashtra	\N	Ayurvedic Consultant	Expert in women health and pregnancy care	1234567895	\N	\N	\N	\N	f	t	user	2025-11-23 06:27:31.14763
9	Dr. Karthik	Iyer	dr_karthik	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	karthik@ayurveda.com	9876543216	Iyer Traditional Medicine	Chennai, Tamil Nadu	\N	Traditional Healer	Practicing traditional South Indian Ayurveda	1234567896	\N	\N	\N	\N	f	t	user	2025-11-23 06:27:31.14763
2	Test	Doctor	testdoc	$2b$10$CgGHb83AaDYZ7I3X1YWJHuPvTJLC0rOZUOCg9YfASiiZLJroxKbfq	testdoc@example.com	\N	Test Clinic	\N	\N	General	\N	\N	\N	\N	\N	\N	t	t	user	2025-11-22 18:09:40.238
\.


--
-- Name: addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.addresses_id_seq', 3, true);


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.admins_id_seq', 1, true);


--
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.appointments_id_seq', 1, true);


--
-- Name: cart_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.cart_items_id_seq', 6, true);


--
-- Name: carts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.carts_id_seq', 3, true);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.items_id_seq', 22, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.orders_id_seq', 16, true);


--
-- Name: patients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.patients_id_seq', 8, true);


--
-- Name: practitioners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.practitioners_id_seq', 9, true);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: admins admins_username_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_username_key UNIQUE (username);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: carts carts_user_id_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key UNIQUE (user_id);


--
-- Name: carts carts_user_id_key1; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key1 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key10; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key10 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key11; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key11 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key12; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key12 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key13; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key13 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key14; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key14 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key15; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key15 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key16; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key16 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key2; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key2 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key3; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key3 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key4; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key4 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key5; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key5 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key6; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key6 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key7; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key7 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key8; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key8 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key9; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key9 UNIQUE (user_id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: patients patients_email_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_email_key UNIQUE (email);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: patients patients_username_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_username_key UNIQUE (username);


--
-- Name: practitioners practitioners_email_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.practitioners
    ADD CONSTRAINT practitioners_email_key UNIQUE (email);


--
-- Name: practitioners practitioners_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.practitioners
    ADD CONSTRAINT practitioners_pkey PRIMARY KEY (id);


--
-- Name: practitioners practitioners_username_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.practitioners
    ADD CONSTRAINT practitioners_username_key UNIQUE (username);


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict b5Ypciic7V1V6mOOPLCkjjj3d1BbyS1djABD1XM1sev2PCtq1t6KzRkXrmgBH7A

