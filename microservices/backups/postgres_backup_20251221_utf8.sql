--
-- PostgreSQL database dump
--

\restrict cwAQxdMhH7VRalVOVWhMxNFjo78sXYG8Yf1tgOPLKugQp0IFde9bx0yYfUYOG9c

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

--
-- Name: enum_coupons_discount_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_coupons_discount_type AS ENUM (
    'percentage',
    'fixed'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.addresses_id_seq OWNED BY public.addresses.id;


--
-- Name: admins; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    practitioner_id integer NOT NULL,
    appointment_date date NOT NULL,
    appointment_time time without time zone NOT NULL,
    status character varying(255) DEFAULT 'Pending'::character varying,
    notes text,
    created_at timestamp with time zone
);


--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: availabilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.availabilities (
    id integer NOT NULL,
    practitioner_id integer,
    day_of_week character varying(10) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: availabilities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.availabilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: availabilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.availabilities_id_seq OWNED BY public.availabilities.id;


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    cart_id integer NOT NULL,
    item_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    added_at timestamp with time zone
);


--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: carts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.carts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: carts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.carts_id_seq OWNED BY public.carts.id;


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    discount_type public.enum_coupons_discount_type DEFAULT 'percentage'::public.enum_coupons_discount_type NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    min_order_value numeric(10,2) DEFAULT 0,
    max_discount numeric(10,2),
    expiry_date timestamp with time zone,
    usage_limit integer,
    used_count integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: COLUMN coupons.max_discount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.coupons.max_discount IS 'Maximum discount amount (useful for percentage coupons)';


--
-- Name: COLUMN coupons.usage_limit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.coupons.usage_limit IS 'Total number of times this coupon can be used (null = unlimited)';


--
-- Name: coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coupons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coupons_id_seq OWNED BY public.coupons.id;


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_status_history (
    id integer NOT NULL,
    order_id integer NOT NULL,
    status integer NOT NULL,
    status_name character varying(50) NOT NULL,
    notes text,
    created_by integer,
    created_at timestamp with time zone
);


--
-- Name: order_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_status_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_status_history_id_seq OWNED BY public.order_status_history.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
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
    practitioner_id integer,
    coupon_code character varying(255),
    discount_amount double precision DEFAULT '0'::double precision,
    final_amount double precision,
    razorpay_order_id character varying(255),
    razorpay_payment_id character varying(255),
    razorpay_signature character varying(255),
    payment_method character varying(255)
);


--
-- Name: COLUMN orders.order_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.order_status IS '0=PendingPayment, 1=Confirmed, 2=Processing, 3=Packed, 4=Shipped, 5=OutForDelivery, 6=Delivered, 7=Cancelled, 8=Returned, 9=Refunded';


--
-- Name: COLUMN orders.practitioner_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.practitioner_id IS 'ID of the practitioner/pharmacy who sold the item';


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;


--
-- Name: practitioners; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: practitioners_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.practitioners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: practitioners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.practitioners_id_seq OWNED BY public.practitioners.id;


--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prescriptions (
    id integer NOT NULL,
    practitioner_id integer NOT NULL,
    patient_id integer NOT NULL,
    medicines jsonb DEFAULT '[]'::jsonb,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: prescriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.prescriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prescriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.prescriptions_id_seq OWNED BY public.prescriptions.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    user_type character varying(20) NOT NULL,
    token character varying(500) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT refresh_tokens_user_type_check CHECK (((user_type)::text = ANY ((ARRAY['patient'::character varying, 'practitioner'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    item_id integer NOT NULL,
    user_id integer NOT NULL,
    user_name character varying(100) NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: wishlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wishlists (
    id integer NOT NULL,
    user_id integer NOT NULL,
    item_id integer NOT NULL,
    created_at timestamp with time zone
);


--
-- Name: wishlists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wishlists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wishlists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wishlists_id_seq OWNED BY public.wishlists.id;


--
-- Name: addresses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: availabilities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availabilities ALTER COLUMN id SET DEFAULT nextval('public.availabilities_id_seq'::regclass);


--
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- Name: carts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts ALTER COLUMN id SET DEFAULT nextval('public.carts_id_seq'::regclass);


--
-- Name: coupons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons ALTER COLUMN id SET DEFAULT nextval('public.coupons_id_seq'::regclass);


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: order_status_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_history ALTER COLUMN id SET DEFAULT nextval('public.order_status_history_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: patients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- Name: practitioners id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practitioners ALTER COLUMN id SET DEFAULT nextval('public.practitioners_id_seq'::regclass);


--
-- Name: prescriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions ALTER COLUMN id SET DEFAULT nextval('public.prescriptions_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: wishlists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists ALTER COLUMN id SET DEFAULT nextval('public.wishlists_id_seq'::regclass);


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.addresses (id, user_id, full_name, street, city, state, zip, phone, is_default) FROM stdin;
1	2	Amit Test	123 Test St	Test City	TS	12345	1234567890	f
2	8	Test User	123 Main St	Mumbai	MH	400001	9876543210	f
3	1	patient_user	L street	pune	maharashtra	412309	698696658998	f
\.


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admins (id, firstname, lastname, username, password, status, joined_on) FROM stdin;
1	Super	Admin	admin_user	$2b$10$ep8rZA4rw8z1UczhfgfCG.qtnsxo.8zygQH13y1LlhyNrJBrrhx7y	active	2025-11-22 13:20:38.767
2	Super	Admin	admin	.UZl/ClG4QQDPK5avd/kKj72A/ihmK	active	2025-12-14 15:04:32.183126
4	New	Admin	newadmin_user	$2b$10$OVmc.lpGzyaZTgt7MbwAsujYQ1KSHlodKOlA8G2xbpw/B9T2LV1XS	active	2025-12-20 07:20:20.19
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.appointments (id, patient_id, practitioner_id, appointment_date, appointment_time, status, notes, created_at) FROM stdin;
1	1	1	2025-11-28	12:00:00	Cancelled	need soln	2025-11-23 18:05:36.45+00
3	1	3	2025-12-14	10:00:00	pending	Initial consultation via Ayur Website	2025-12-14 11:40:33.87+00
4	1	3	2025-12-16	10:30:00	Cancelled	Initial consultation via Ayur Website	2025-12-14 11:40:55.422+00
5	1	1	2025-12-15	10:00:00	Rejected	Initial consultation via Ayur Website	2025-12-14 13:15:58.605+00
2	1	1	2025-12-15	10:30:00	Rejected	Initial consultation via Ayur Website	2025-12-14 11:34:56.471+00
6	1	1	2025-12-15	11:00:00	Rejected	Initial consultation via Ayur Website	2025-12-14 13:33:31.932+00
\.


--
-- Data for Name: availabilities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.availabilities (id, practitioner_id, day_of_week, start_time, end_time, is_available, created_at) FROM stdin;
7	1	Monday	09:00:00	17:00:00	t	2025-12-20 07:22:27.917
8	1	Thursday	09:00:00	17:00:00	t	2025-12-20 07:22:27.918
9	1	Tuesday	09:00:00	19:00:00	t	2025-12-20 07:22:27.918
10	1	Tuesday	18:00:00	20:00:00	t	2025-12-20 07:22:27.918
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cart_items (id, cart_id, item_id, quantity, added_at) FROM stdin;
90	3	3	1	2025-12-20 05:21:59.297+00
91	3	2	1	2025-12-20 05:22:08.111+00
92	3	7	1	2025-12-20 05:22:17.332+00
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.carts (id, user_id, created_at, updated_at) FROM stdin;
1	2	2025-11-29 04:08:16.898+00	2025-11-29 04:08:16.908+00
2	8	2025-11-29 09:26:14.475+00	2025-11-29 09:26:14.491+00
3	1	2025-11-30 07:26:24.063+00	2025-11-30 07:26:24.066+00
4	9	2025-12-18 17:41:04.953+00	2025-12-18 17:41:04.958+00
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coupons (id, code, discount_type, discount_value, min_order_value, max_discount, expiry_date, usage_limit, used_count, is_active, created_at) FROM stdin;
4	FIRSTORDER	percentage	15.00	0.00	100.00	2025-12-31 00:00:00+00	\N	2	t	2025-12-04 19:32:39.16307+00
3	SAVE50	fixed	50.00	200.00	\N	2025-12-31 00:00:00+00	100	2	t	2025-12-04 19:32:39.16307+00
2	WELCOME10	percentage	10.00	100.00	50.00	2025-12-31 00:00:00+00	\N	2	t	2025-12-04 19:32:39.16307+00
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.items (id, item_title, item_brand, item_cat, item_details, item_tags, item_image, item_quantity, item_price, added_by, status) FROM stdin;
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
2	Globulus	Globulus	medicine	Treats skin infections and other skin disorders	skin, infection	med2.jpg	100	200	\N	Approved
\.


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_status_history (id, order_id, status, status_name, notes, created_by, created_at) FROM stdin;
1	23	2	Processing	Status updated to Processing	1	2025-12-07 06:16:07.003+00
2	24	1	Confirmed	Order placed successfully	1	2025-12-12 18:19:29.001+00
3	27	2	Processing	Status updated to Processing	1	2025-12-16 17:53:19.071+00
4	27	3	Packed	Status updated to Packed	1	2025-12-16 17:53:29.589+00
5	27	4	Shipped	Status updated to Shipped	1	2025-12-16 17:54:04.403+00
6	13	6	Delivered	Auto-marked as delivered (5 days after shipping)	\N	2025-12-16 19:23:17.225+00
7	32	1	Confirmed	Order placed successfully	1	2025-12-18 17:33:43.716+00
8	33	1	Confirmed	Order placed successfully	1	2025-12-18 17:33:47.718+00
9	34	1	Confirmed	Order placed successfully	1	2025-12-18 17:33:49.094+00
10	35	1	Confirmed	Order placed successfully	1	2025-12-18 17:34:03.398+00
11	36	1	Confirmed	Order placed successfully	1	2025-12-18 17:34:15.722+00
12	37	1	Confirmed	Order placed successfully	1	2025-12-18 17:34:16.295+00
13	38	1	Confirmed	Order placed successfully	9	2025-12-18 17:40:51.445+00
14	39	1	Confirmed	Order placed successfully	9	2025-12-18 17:42:38.959+00
15	40	1	Confirmed	Order placed successfully	9	2025-12-18 17:44:32.14+00
16	41	1	Confirmed	Order placed successfully	9	2025-12-18 17:47:59.393+00
17	42	1	Confirmed	Order placed successfully	9	2025-12-18 17:51:17.47+00
18	43	1	Confirmed	Order placed successfully	9	2025-12-18 17:55:00.959+00
19	44	1	Confirmed	Order placed successfully	1	2025-12-18 18:07:50.693+00
20	45	1	Confirmed	Order placed successfully	9	2025-12-18 18:09:01.261+00
21	46	1	Confirmed	Order placed successfully	9	2025-12-18 18:11:57.536+00
22	47	1	Confirmed	Order placed successfully	1	2025-12-18 18:13:08.726+00
23	48	1	Confirmed	Order placed successfully	1	2025-12-18 18:16:31.15+00
24	49	1	Confirmed	Order placed successfully	9	2025-12-18 18:17:01.837+00
25	50	1	Confirmed	Order placed successfully	9	2025-12-18 18:18:32.189+00
26	51	1	Confirmed	Order placed successfully	9	2025-12-18 18:21:37.895+00
27	54	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:26.721+00
30	52	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:26.75+00
29	53	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:26.74+00
28	57	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:26.732+00
31	56	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:26.767+00
32	55	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:26.782+00
33	58	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:27.029+00
34	59	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:27.043+00
35	61	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:27.212+00
36	60	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:27.215+00
37	62	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:27.222+00
38	63	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:27.261+00
39	65	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:27.672+00
40	64	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:27.688+00
41	66	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:27.87+00
42	68	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:27.907+00
43	67	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:27.89+00
44	69	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:27.935+00
45	71	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:28.068+00
46	70	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:28.081+00
47	72	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:28.109+00
48	73	1	Confirmed	Order placed successfully	9	2025-12-18 18:29:52.575+00
49	74	1	Confirmed	Order placed successfully	9	2025-12-18 18:30:24.819+00
50	75	1	Confirmed	Order placed successfully	1	2025-12-18 18:30:30.302+00
51	76	1	Confirmed	Order placed successfully	9	2025-12-18 18:30:54.705+00
52	77	1	Confirmed	Order placed successfully	9	2025-12-18 18:31:34.372+00
53	78	1	Confirmed	Order placed successfully	9	2025-12-18 18:32:00.375+00
54	79	1	Confirmed	Order placed successfully	9	2025-12-18 18:32:37.417+00
55	80	1	Confirmed	Order placed successfully	9	2025-12-18 18:33:42.909+00
56	81	1	Confirmed	Order placed successfully	9	2025-12-18 18:33:56.881+00
57	82	1	Confirmed	Order placed successfully	9	2025-12-18 18:35:07.001+00
58	83	1	Confirmed	Order placed successfully	9	2025-12-18 18:38:50.594+00
59	84	1	Confirmed	Order placed successfully	9	2025-12-18 18:40:45.543+00
60	85	1	Confirmed	Order placed successfully	9	2025-12-18 18:51:17.387+00
61	38	7	Cancelled	Order cancelled by user	9	2025-12-18 18:58:18.706+00
62	39	7	Cancelled	Order cancelled by user	9	2025-12-18 18:58:25.817+00
63	40	7	Cancelled	Order cancelled by user	9	2025-12-18 18:58:33.684+00
64	41	7	Cancelled	Order cancelled by user	9	2025-12-18 18:58:37.231+00
65	42	7	Cancelled	Order cancelled by user	9	2025-12-18 18:58:41.367+00
66	121	1	Confirmed	Order placed successfully	1	2025-12-19 16:38:45.893+00
67	122	1	Confirmed	Order placed successfully	1	2025-12-19 16:39:47.628+00
68	123	1	Confirmed	Order placed successfully	1	2025-12-19 16:39:57.311+00
69	124	1	Confirmed	Order placed successfully	1	2025-12-19 16:40:44.329+00
70	128	1	Confirmed	Payment Successful via Razorpay (ID: pay_RtZJlYSQzrC3JG)	1	2025-12-19 18:27:57.027+00
71	119	7	Cancelled	Order cancelled by user	1	2025-12-19 18:56:10.235+00
72	127	1	Confirmed	Payment Successful via Razorpay (ID: pay_RtZpQivXVeCzPg)	1	2025-12-19 18:57:12.953+00
73	126	7	Cancelled	Order cancelled by user	1	2025-12-19 18:57:27.266+00
74	125	7	Cancelled	Order cancelled by user	1	2025-12-19 18:57:30.647+00
75	128	7	Cancelled	Order cancelled by user	1	2025-12-19 19:13:17.51+00
76	120	1	Confirmed	Payment Successful via Razorpay (ID: pay_RtvEFS0OhJK5RW)	1	2025-12-20 15:53:20.533+00
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, item_id, user_id, order_quantity, order_date, order_status, address_id, tracking_number, shipped_date, delivered_date, estimated_delivery, practitioner_id, coupon_code, discount_amount, final_amount, razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_method) FROM stdin;
1	1	1	1	2024-04-09	0	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N
2	2	1	1	2024-04-09	0	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N
3	1	2	2	2024-04-10	0	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N
4	3	2	1	2024-04-10	1	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N
7	3	1	1	2025-11-22	0	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N
9	2	1	1	2025-11-21	0	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N
10	3	1	3	2025-11-22	0	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N
12	2	2	1	2025-11-29	1	1	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N
14	2	2	1	2025-11-29	1	1	\N	\N	\N	2025-12-04	\N	\N	0	\N	\N	\N	\N	\N
15	2	8	1	2025-11-29	7	2	\N	\N	\N	2025-12-04	\N	\N	0	\N	\N	\N	\N	\N
8	1	1	2	2025-11-20	7	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N
5	2	1	3	2024-04-10	7	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N
16	12	1	4	2025-11-30	1	3	\N	\N	\N	2025-12-05	\N	\N	0	\N	\N	\N	\N	\N
17	11	1	2	2025-12-04	7	3	\N	\N	\N	2025-12-09	\N	\N	0	598	\N	\N	\N	\N
19	12	1	1	2025-12-04	7	3	\N	\N	\N	2025-12-09	\N	\N	0	150	\N	\N	\N	\N
18	11	1	1	2025-12-04	7	3	\N	\N	\N	2025-12-09	\N	\N	0	299	\N	\N	\N	\N
20	11	1	3	2025-12-04	1	3	\N	\N	\N	2025-12-09	\N	FIRSTORDER	74.94	822.06	\N	\N	\N	\N
21	12	1	2	2025-12-04	1	3	\N	\N	\N	2025-12-09	\N	FIRSTORDER	25.06	274.94	\N	\N	\N	\N
22	11	1	3	2025-12-06	1	3	\N	\N	\N	2025-12-11	\N	FIRSTORDER	100	797	\N	\N	\N	\N
23	11	1	5	2025-12-07	2	3	\N	\N	\N	2025-12-12	\N	SAVE50	50	1445	\N	\N	\N	\N
24	2	1	1	2025-12-12	1	\N	\N	\N	\N	2025-12-17	\N	\N	0	\N	\N	\N	\N	\N
25	101	2	1	2025-12-16	6	\N	\N	\N	\N	\N	1	\N	0	50	\N	\N	\N	\N
26	102	3	2	2025-12-15	4	\N	\N	\N	\N	\N	1	\N	0	60	\N	\N	\N	\N
28	104	4	1	2025-12-16	7	\N	\N	\N	\N	\N	1	\N	0	100	\N	\N	\N	\N
42	2	9	1	2025-12-18	7	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
86	3	1	1	2025-12-18	0	3	\N	\N	\N	2025-12-23	\N	\N	0	99	\N	\N	\N	\N
27	103	2	1	2025-12-14	4	\N	gyv88	2025-12-16 17:54:04.39+00	\N	\N	1	\N	0	20	\N	\N	\N	\N
29	101	2	2	2025-12-16	1	\N	\N	\N	\N	\N	\N	\N	0	40	\N	\N	\N	\N
13	2	2	1	2025-11-29	6	1	ASD12357	2025-11-30 06:29:53.491+00	2025-12-16 19:23:17.208+00	2025-12-04	\N	\N	0	\N	\N	\N	\N	\N
30	11	1	1	2025-12-18	1	3	\N	\N	\N	2025-12-23	\N	SAVE50	31.21	267.79	\N	\N	\N	\N
31	19	1	1	2025-12-18	1	3	\N	\N	\N	2025-12-23	\N	SAVE50	18.79	161.21	\N	\N	\N	\N
32	2	1	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
33	6	1	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
34	7	1	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
35	16	1	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
36	11	1	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
37	11	1	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
43	2	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
44	2	1	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
45	2	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
46	2	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
47	2	1	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
48	2	1	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
49	2	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
50	3	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
51	4	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
54	2	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
53	5	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
52	4	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
55	3	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
56	6	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
57	7	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
58	8	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
59	9	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
61	12	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
62	13	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
60	11	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
63	14	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
64	15	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
65	16	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
66	17	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
67	18	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
68	19	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
69	20	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
70	21	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
71	22	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
72	1	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
73	2	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
74	2	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
75	2	1	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
76	2	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
77	2	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
78	3	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
79	2	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
80	2	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
81	2	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
82	2	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
83	4	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
84	2	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
85	3	9	1	2025-12-18	1	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
38	2	9	1	2025-12-18	7	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
39	2	9	1	2025-12-18	7	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
40	3	9	1	2025-12-18	7	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
41	2	9	1	2025-12-18	7	\N	\N	\N	\N	2025-12-23	\N	\N	0	\N	\N	\N	\N	\N
87	4	1	13	2025-12-18	1	3	\N	\N	\N	2025-12-23	\N	\N	0	1300	\N	\N	\N	\N
121	2	1	1	2025-12-19	1	\N	\N	\N	\N	2025-12-24	\N	\N	0	\N	\N	\N	\N	\N
122	3	1	1	2025-12-19	1	\N	\N	\N	\N	2025-12-24	\N	\N	0	\N	\N	\N	\N	\N
123	2	1	1	2025-12-19	1	\N	\N	\N	\N	2025-12-24	\N	\N	0	\N	\N	\N	\N	\N
124	4	1	1	2025-12-19	1	\N	\N	\N	\N	2025-12-24	\N	\N	0	\N	\N	\N	\N	\N
120	3	1	4	2025-12-19	1	3	\N	\N	\N	2025-12-24	\N	\N	0	396	order_RtvDdGarDbXqDV	pay_RtvEFS0OhJK5RW	d5581aae958ed03a66bb7844b1c067caff8b368680ad36dc34e0a3d8909b1671	Online
119	2	1	5	2025-12-19	7	3	\N	\N	\N	2025-12-24	\N	\N	0	1000	\N	\N	\N	\N
127	3	1	1	2025-12-19	1	3	\N	\N	\N	2025-12-24	\N	\N	0	99	order_RtZojiBkslUZOv	pay_RtZpQivXVeCzPg	76261ee85b4f0102a2d4cba580f06bacfec971adbc5e067d2a914f8b63c6c848	Online
126	2	1	1	2025-12-19	7	3	\N	\N	\N	2025-12-24	\N	\N	0	200	\N	\N	\N	razorpay
125	2	1	1	2025-12-19	7	3	\N	\N	\N	2025-12-24	\N	\N	0	200	\N	\N	\N	\N
128	1	1	1	2025-12-19	7	3	\N	\N	\N	2025-12-24	\N	\N	0	70	order_RtZG9CoSFXxzmm	pay_RtZJlYSQzrC3JG	1c7d9c63470217102b7943386779663a8764ac2220fefb8b94dc3876802a1297	Online
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patients (id, fname, lname, username, password, email, phone, profile, address, joined_on) FROM stdin;
2	Amit	Verma	amit_v	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	amit@example.com	9123456780	\N	Delhi, India	2025-11-23 06:27:31.164612
3	Sneha	Kapoor	sneha_k	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	sneha@example.com	9123456781	\N	Mumbai, India	2025-11-23 06:27:31.164612
4	Rahul	Mehta	rahul_m	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	rahul@example.com	9123456782	\N	Bangalore, India	2025-11-23 06:27:31.164612
5	Pooja	Nair	pooja_n	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	pooja@example.com	9123456783	\N	Chennai, India	2025-11-23 06:27:31.164612
6	Arjun	Rao	arjun_r	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	arjun@example.com	9123456784	\N	Hyderabad, India	2025-11-23 06:27:31.164612
7	Kavya	Prasad	kavya_p	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	kavya@example.com	9123456785	\N	Pune, India	2025-11-23 06:27:31.164612
8	Test	Patient	test_patient_01	$2b$10$r53dlVj3ds2NSCcV/WK0au6kJnNJifKBaBrhhmllx6oajTIFGPX92	test_patient_01@example.com	9876543210	\N	123 St, City, State, 123456	2025-11-29 09:19:53.695
9				$2b$10$O1iOWtNcePvf2P2dmu9/qeexT3LOtpKdN3fDhOUSfv5BM1zcK6VoG			\N		2025-12-18 17:38:50.605
1	John	Doe	patient_user	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	patient@example.com	1234567890	\N	123 Patient St , UK	2025-11-22 13:20:38.561
\.


--
-- Data for Name: practitioners; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.practitioners (id, fname, lname, username, password, email, phone, office_name, address, profile, professionality, bio, nida, businesslicense, facebook, twitter, license, verified, is_new, role, joined_on) FROM stdin;
1	Jane	Smith	practitioner_user	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	practitioner@example.com	0987654321	Smith Clinic	456 Healer Ave	\N	Ayurveda	\N	\N	\N	\N	\N	\N	t	t	practitioner	2025-11-22 13:20:38.742
3	Dr. Rajesh	Sharma	dr_rajesh	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	rajesh@ayurveda.com	9876543210	Sharma Ayurvedic Clinic	Mumbai, Maharashtra	\N	Ayurvedic Physician	Specialized in Panchakarma therapy with 15 years experience	1234567890	\N	\N	\N	\N	t	t	practitioner	2025-11-23 06:27:31.088587
4	Dr. Priya	Patel	dr_priya	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	priya@ayurveda.com	9876543211	Patel Wellness Center	Ahmedabad, Gujarat	\N	Ayurvedic Consultant	Expert in herbal medicine and dietary consultation	1234567891	\N	\N	\N	\N	t	t	practitioner	2025-11-23 06:27:31.088587
5	Dr. Arun	Kumar	dr_arun	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	arun@ayurveda.com	9876543212	Kumar Ayurvedic Hospital	Bangalore, Karnataka	\N	Senior Ayurvedic Doctor	Specializing in chronic disease management	1234567892	\N	\N	\N	\N	t	t	practitioner	2025-11-23 06:27:31.088587
7	Dr. Vikram	Singh	dr_vikram	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	vikram@ayurveda.com	9876543214	Singh Wellness Spa	Jaipur, Rajasthan	\N	Ayurvedic Therapist	Specialized in stress management and rejuvenation	1234567894	\N	\N	\N	\N	f	t	practitioner	2025-11-23 06:27:31.14763
8	Dr. Anita	Desai	dr_anita	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	anita@ayurveda.com	9876543215	Desai Ayurvedic Center	Pune, Maharashtra	\N	Ayurvedic Consultant	Expert in women health and pregnancy care	1234567895	\N	\N	\N	\N	f	t	practitioner	2025-11-23 06:27:31.14763
9	Dr. Karthik	Iyer	dr_karthik	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	karthik@ayurveda.com	9876543216	Iyer Traditional Medicine	Chennai, Tamil Nadu	\N	Traditional Healer	Practicing traditional South Indian Ayurveda	1234567896	\N	\N	\N	\N	f	t	practitioner	2025-11-23 06:27:31.14763
2	Test	Doctor	testdoc	$2b$10$CgGHb83AaDYZ7I3X1YWJHuPvTJLC0rOZUOCg9YfASiiZLJroxKbfq	testdoc@example.com	\N	Test Clinic	\N	\N	General	\N	\N	\N	\N	\N	\N	t	t	practitioner	2025-11-22 18:09:40.238
6	Dr. Meera	Reddy	dr_meera	$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy	meera@ayurveda.com	9876543213	Reddy Ayurvedic Clinic	Hyderabad, Telangana	\N	Ayurvedic Practitioner	Focus on skin and hair care treatments	1234567893	\N	\N	\N	\N	t	t	practitioner	2025-11-23 06:27:31.14763
\.


--
-- Data for Name: prescriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.prescriptions (id, practitioner_id, patient_id, medicines, notes, created_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, user_id, user_type, token, expires_at, created_at) FROM stdin;
1	1	patient	50a7ece7cb5786d3ebd388a3c3a31ea3d7a245793046ba0344757db4ad98244531a964deea7b7703979ca9e248d0f4b9fdc6c7b52411a00958ca9b4974de1a8b	2025-12-13 18:46:42.341	2025-12-06 18:46:42.347
2	1	patient	fdea46a44959573cea8788a0b60640dc2acd9e52a29831fc426c832edfc55256463b4843841c3db2a48d3950a96cb6e34f8c4fbc63706f98d57a58d1b2467701	2025-12-13 18:46:52.26	2025-12-06 18:46:52.26
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (id, item_id, user_id, user_name, rating, comment, created_at) FROM stdin;
1	2	1	patient_user	4	great medicine	2025-12-12 18:19:24.082
\.


--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wishlists (id, user_id, item_id, created_at) FROM stdin;
\.


--
-- Name: addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.addresses_id_seq', 3, true);


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admins_id_seq', 4, true);


--
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.appointments_id_seq', 6, true);


--
-- Name: availabilities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.availabilities_id_seq', 10, true);


--
-- Name: cart_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cart_items_id_seq', 92, true);


--
-- Name: carts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.carts_id_seq', 4, true);


--
-- Name: coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.coupons_id_seq', 4, true);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.items_id_seq', 22, true);


--
-- Name: order_status_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_status_history_id_seq', 76, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 128, true);


--
-- Name: patients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.patients_id_seq', 12, true);


--
-- Name: practitioners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.practitioners_id_seq', 9, true);


--
-- Name: prescriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.prescriptions_id_seq', 1, false);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 2, true);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reviews_id_seq', 1, true);


--
-- Name: wishlists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wishlists_id_seq', 3, true);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: admins admins_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_username_key UNIQUE (username);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: availabilities availabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availabilities
    ADD CONSTRAINT availabilities_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: carts carts_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key UNIQUE (user_id);


--
-- Name: carts carts_user_id_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key1 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key10; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key10 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key11; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key11 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key12; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key12 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key13; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key13 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key14; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key14 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key15; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key15 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key16; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key16 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key17; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key17 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key18; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key18 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key19; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key19 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key2 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key20; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key20 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key21; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key21 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key22; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key22 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key23; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key23 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key24; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key24 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key25; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key25 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key26; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key26 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key27; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key27 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key28; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key28 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key29; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key29 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key3 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key30; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key30 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key31; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key31 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key32; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key32 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key33; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key33 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key34; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key34 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key35; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key35 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key36; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key36 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key37; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key37 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key38; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key38 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key39; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key39 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key4 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key40; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key40 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key41; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key41 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key42; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key42 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key43; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key43 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key44; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key44 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key45; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key45 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key46; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key46 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key47; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key47 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key48; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key48 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key49; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key49 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key5 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key50; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key50 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key51; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key51 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key6 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key7 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key8 UNIQUE (user_id);


--
-- Name: carts carts_user_id_key9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key9 UNIQUE (user_id);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_code_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key1 UNIQUE (code);


--
-- Name: coupons coupons_code_key10; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key10 UNIQUE (code);


--
-- Name: coupons coupons_code_key11; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key11 UNIQUE (code);


--
-- Name: coupons coupons_code_key12; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key12 UNIQUE (code);


--
-- Name: coupons coupons_code_key13; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key13 UNIQUE (code);


--
-- Name: coupons coupons_code_key14; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key14 UNIQUE (code);


--
-- Name: coupons coupons_code_key15; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key15 UNIQUE (code);


--
-- Name: coupons coupons_code_key16; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key16 UNIQUE (code);


--
-- Name: coupons coupons_code_key17; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key17 UNIQUE (code);


--
-- Name: coupons coupons_code_key18; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key18 UNIQUE (code);


--
-- Name: coupons coupons_code_key19; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key19 UNIQUE (code);


--
-- Name: coupons coupons_code_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key2 UNIQUE (code);


--
-- Name: coupons coupons_code_key20; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key20 UNIQUE (code);


--
-- Name: coupons coupons_code_key21; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key21 UNIQUE (code);


--
-- Name: coupons coupons_code_key22; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key22 UNIQUE (code);


--
-- Name: coupons coupons_code_key23; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key23 UNIQUE (code);


--
-- Name: coupons coupons_code_key24; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key24 UNIQUE (code);


--
-- Name: coupons coupons_code_key25; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key25 UNIQUE (code);


--
-- Name: coupons coupons_code_key26; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key26 UNIQUE (code);


--
-- Name: coupons coupons_code_key27; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key27 UNIQUE (code);


--
-- Name: coupons coupons_code_key28; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key28 UNIQUE (code);


--
-- Name: coupons coupons_code_key29; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key29 UNIQUE (code);


--
-- Name: coupons coupons_code_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key3 UNIQUE (code);


--
-- Name: coupons coupons_code_key30; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key30 UNIQUE (code);


--
-- Name: coupons coupons_code_key31; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key31 UNIQUE (code);


--
-- Name: coupons coupons_code_key32; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key32 UNIQUE (code);


--
-- Name: coupons coupons_code_key33; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key33 UNIQUE (code);


--
-- Name: coupons coupons_code_key34; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key34 UNIQUE (code);


--
-- Name: coupons coupons_code_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key4 UNIQUE (code);


--
-- Name: coupons coupons_code_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key5 UNIQUE (code);


--
-- Name: coupons coupons_code_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key6 UNIQUE (code);


--
-- Name: coupons coupons_code_key7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key7 UNIQUE (code);


--
-- Name: coupons coupons_code_key8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key8 UNIQUE (code);


--
-- Name: coupons coupons_code_key9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key9 UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: patients patients_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_email_key UNIQUE (email);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: patients patients_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_username_key UNIQUE (username);


--
-- Name: practitioners practitioners_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practitioners
    ADD CONSTRAINT practitioners_email_key UNIQUE (email);


--
-- Name: practitioners practitioners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practitioners
    ADD CONSTRAINT practitioners_pkey PRIMARY KEY (id);


--
-- Name: practitioners practitioners_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practitioners
    ADD CONSTRAINT practitioners_username_key UNIQUE (username);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_user_id_item_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_item_id_key UNIQUE (user_id, item_id);


--
-- Name: coupons_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX coupons_code ON public.coupons USING btree (code);


--
-- Name: idx_order_status_history_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_status_history_order ON public.order_status_history USING btree (order_id);


--
-- Name: idx_refresh_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens USING btree (token);


--
-- Name: idx_refresh_tokens_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens USING btree (user_id, user_type);


--
-- Name: wishlists_user_id_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX wishlists_user_id_item_id ON public.wishlists USING btree (user_id, item_id);


--
-- Name: availabilities availabilities_practitioner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availabilities
    ADD CONSTRAINT availabilities_practitioner_id_fkey FOREIGN KEY (practitioner_id) REFERENCES public.practitioners(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_status_history order_status_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: prescriptions prescriptions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: prescriptions prescriptions_practitioner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_practitioner_id_fkey FOREIGN KEY (practitioner_id) REFERENCES public.practitioners(id);


--
-- Name: reviews reviews_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict cwAQxdMhH7VRalVOVWhMxNFjo78sXYG8Yf1tgOPLKugQp0IFde9bx0yYfUYOG9c

