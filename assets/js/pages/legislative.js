
      // Legislative Process Tabs
      document.addEventListener('DOMContentLoaded', function () {
        const tabBtns = document.querySelectorAll('.leg-tab-btn');
        const tabContents = document.querySelectorAll('.leg-tab-content');

        tabBtns.forEach((btn) => {
          btn.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');

            // Remove active from all buttons and contents
            tabBtns.forEach((b) => b.classList.remove('active'));
            tabContents.forEach((c) => c.classList.remove('active'));

            // Add active to clicked button and corresponding content
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
          });
        });
      });
    