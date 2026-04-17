import './FooterComuna.css';

function FooterComuna() {
  return (
    <footer className="comuna-footer py-3 px-3 px-md-4">
      <div className="comuna-footer-inner">
        <img
          src="/logo.PNG"
          alt="Logo Comuna Rural La Florida y Luisiana"
          className="comuna-logo"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = '/logo192.png';
          }}
        />

        <p className="comuna-text mb-2">Comuna Rural la Florida y Luisiana</p>

        <div className="comuna-social d-flex align-items-center justify-content-center gap-3">
          <a
            href="https://www.tiktok.com/@comunalafloridayluisiana?_r=1&_t=ZS-95aTQUzABTW"
            target="_blank"
            rel="noreferrer"
            aria-label="TikTok"
            className="social-item"
          >
            <i className="bi bi-tiktok" />
          </a>
          <a
            href="https://www.facebook.com/share/17JKvFDdDn/?mibextid=wwXIfr"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
            className="social-item"
          >
            <i className="bi bi-facebook" />
          </a>
          <a
            href="https://www.instagram.com/floridayluisiana?igsh=MTh5OTgyNnc2ejVodg=="
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="social-item"
          >
            <i className="bi bi-instagram" />
          </a>
          <a
            href="https://whatsapp.com/channel/0029Vb7hThe9Bb5tlllhzh1B"
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
            className="social-item"
          >
            <i className="bi bi-whatsapp" />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default FooterComuna;